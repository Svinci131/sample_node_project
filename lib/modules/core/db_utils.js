'use strict'

module.exports = {

  /**
   * Applies sorting by the given field to the database query. If the field
   * doesn't actually exist or isn't provided in as a request query parameter,
   * it will sort by _id.
   *
   * @param {Object} queryResult - Returned by Mongoose's find() method.
   * @param {Request} request - The request object.
   * @return {Query} - Database query.
   */
  applyDbSort: function(queryResult, request) {
    if (request === undefined || request === null) {
      return queryResult
    }

    let sortField = request.query.sort

    if (sortField === undefined ||
        queryResult.schema.paths[sortField] === undefined) {
      if (queryResult.schema.paths['createdAt'] !== undefined) {
        sortField = 'createdAt'
      }
      else {
        sortField = '_id'
      }
    }

    return queryResult.sort(sortField)
  },

  /**
   * Removes certain fields from the result set. Those fields are used
   * internally by Mongoose.
   *
   * @param {Object} queryResult - Returned by Mongoose's find() method.
   * @param {Request} request - The request object.
   * @return {Query} - Database query.
   */
  applyDbSelects: function(queryResult) {
    return queryResult.select('-__v')
  },

  /**
   * Paginates the database query before executing it - starts at the record
   * specified by the `pageRefItem` query parameter and retrieves the number of
   * following records specified by the `pageLimit` query parameter.
   * If `pageRefItem` is not provided, it is automatically set to the first
   * item in the result set (beginning of page 1). If both `pageRefItem` and
   * `pageLimit` are not provided, the original, unmodified query result
   * is returned. The function properly handles query sets that are sorted
   * in either descending or ascending order.

   * @param {Object} queryResult - Returned by Mongoose's find() method.
   * @param {Request} request - The request object.
   * @return {Query} - Database query.
   */
  applyDbPagination: function(queryResult, request) {
    if (request === undefined || request === null) {
      return queryResult
    }

    let refObjectId = request.query.pageRefItem
    let limit = request.query.pageLimit

    if (refObjectId === undefined && limit === undefined) {
      return queryResult
    }

    let sortFieldName = this._getSortFieldName(queryResult)
    let sortDirection = this._getSortDirection(queryResult)

    if (refObjectId === undefined) {
      return queryResult.limit(limit)
    }
    else {
      queryResult = queryResult.where(sortFieldName)

      if (sortDirection === 1) {
        queryResult = queryResult.gt(refObjectId)
      }
      else {
        queryResult = queryResult.lt(refObjectId)
      }

      return queryResult.limit(limit)
    }
  },

  _getSortFieldName: function(queryResult) {
    return Object.keys(queryResult.options.sort)[0]
  },

  _getSortDirection: function(queryResult) {
    return queryResult.options.sort[this._getSortFieldName(queryResult)]
  },

  /**
   * Applies parameters to the database query to achieve goals such as sorting
   * by a desired field, pagination or limiting the amount of returned data.
   *
   * @param {Object} queryResult - Returned by Mongoose's find() method.
   * @param {Request} request - The request object.
   * @return {Query} - Database query.
   */
  groomQuery: function(queryResult, request) {
    return this.applyDbSelects(
      this.applyDbPagination(
        this.applyDbSort(queryResult, request),
        request
      )
    )
  }

}
