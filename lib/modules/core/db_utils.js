const _removeNegationSignFromSortField = (sortField) => {
  if (!sortField) return sortField
  return sortField[0] === '-' ? sortField.slice(1) : sortField
}


const _isAscending = (sortField) => {
  return sortField[0] !== '-'
}

/* Checks if the given field doesn't actually exist or isn't provided */
const _isSortFieldSpecified = (queryResult, sortField) => {
  const { singleNestedPaths, paths } = queryResult.model.schema
  const sortFieldName = _removeNegationSignFromSortField(sortField)
  const fieldExists = paths[sortFieldName] || singleNestedPaths[sortFieldName]
  if (!sortField || !fieldExists) return false
  return true
}

/**
 * Removes certain fields from the result set. Those fields are used
 * internally by Mongoose.
 *
 * @param {Object} queryResult - Returned by Mongoose's find() method.
 * @param {Request} request - The request object.
 * @return {Query} - Database query.
 */
const applyDbSelects = (queryResult) => {
  return queryResult.select('-__v')
}

/**
 * Takes a string with multiple fields names seperated by a comma
 * check that each field is valid for the query result and returns an object
 * that can be used to sort the given queryResult.
 *
 * @param {string} sortFields - The fields to sort by.
 *    ex. 'name' , 'name,hid'. 'name,-hid'
 * @param {Object} queryResult - Returned by Mongoose's find() method.
 */
const _parseSortFields = (sortFields, queryResult) => {
  if (!sortFields) return []

  return sortFields.split(',').reduce((sortObj, field) => {
    const sortSpecified = _isSortFieldSpecified(queryResult, field)

    if (!sortSpecified) return sortObj

    if (_isAscending(field)) sortObj[field] = 1
    else sortObj[_removeNegationSignFromSortField(field)] = -1

    return sortObj
  }, {})
}

/**
 * Applies sorting by the given field or fields to the database query.
 * It checks that each field in the string actually exists and
 * if does it adds that field to the sort object. If no valid fields are provided
 * in the a request query parameter, it will sort by createdAt or _id.
 * Example sort fields include: 'name', 'name.last', '-name', 'name,-hid'
 *
 * @param {Object} queryResult - Returned by Mongoose's find() method.
 * @param {Object} request - The request object.
 * @return {Query} - Database query.
 */
const applyDbSort = (queryResult, request) => {
  if (!request || !request.query) return queryResult

  const { paths } = queryResult.model.schema
  const sortData = request.query.sort

  let sortFields = _parseSortFields(sortData, queryResult)
  const noSortFieldsGiven = Object.keys(sortFields).length

  if (!noSortFieldsGiven) {
    if (paths.createdAt !== undefined) {
      sortFields = { createdAt: 1 }
    } else {
      sortFields = { _id: 1 }
    }
  }

  return queryResult.sort(sortFields)
}


/**
 * Paginates the database query before executing it - starts at the index
 * specified by the `offset` query parameter and retrieves the number of
 * following records specified by the `pageLimit` query parameter.
 * If `offset` is not provided, it is automatically set to 0
 * in the result set (beginning of page 1). If both `offset` and
 * `pageLimit` are not provided, the original, unmodified query result
 * is returned. The function properly handles query sets that are sorted
 * in either descending or ascending order.

 * @param {Object} queryResult - Returned by Mongoose's find() method.
 * @param {Request} request - The request object.
 * @return {Query} - Database query.
 */
const applyDbPagination = (queryResult, request, Config) => {
  if (!request || !request.query) return queryResult

  /* IGNORE PAGINATION WHEN COUNT IS TRUE */
  if (request.query.count) return queryResult

  const offset = parseInt(request.query.offset, 10)
  let limit = parseInt(request.query.pageLimit, 10)

  /* If limit is not present in request */
  if (!limit) {
    if (Config && Config.get('app.default_page_limit')) {
      limit = Config.get('app.default_page_limit')
    } else {
      limit = 100
    }
  }

  if (offset) {
    queryResult = queryResult.skip(offset)
  }

  return queryResult.limit(limit)
}

/**
 * Applies count to the query if the count param is true.
 * (The query will now return the number of docs found when it is executed.)
 *
 * @param {Object} queryResult - Returned by Mongoose's find() method.
 * @param {Request} request - The request object.
 * @return {Query} - Database query.
 */
const applyDbCount = (queryResult, request) => {
  if (!request || !request.query) return queryResult

  const count = request.query.count
  if (!count) return queryResult

  return queryResult.count()
}

/**
 * Applies parameters to the database query to achieve goals such as sorting
 * by a desired field, pagination or limiting the amount of returned data.
 *
 * @param {Object} queryResult - Returned by Mongoose's find() method.
 * @param {Request} request - The request object.
 * @param {Object} Config - The Config module object. (Optional)
 * @return {Query} - Database query.
 */
const groomQuery = (queryResult, request, Config) => (
  applyDbCount(
    applyDbSelects(
      applyDbPagination(
        applyDbSort(queryResult, request),
        request,
        Config
      )
    ),
    request
  )
)

module.exports = {
  applyDbCount,
  applyDbPagination,
  applyDbSelects,
  applyDbSort,
  groomQuery
}
