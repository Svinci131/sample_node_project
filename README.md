
### Build

```
 docker-compose up

```

### Test

```
 npm test

```

### Routes:

Test - http://0.0.0.0:50/ping

POST, LIST -http://0.0.0.0:50/api/v1.0/patients

PUT, GET, DELETE - http://0.0.0.0:50/api/v1.0/patients/{id}

PATCH - _NOT FULLY IMPLEMENTED_
http://0.0.0.0:50/api/v1.0/patients/{id}

### File Structure
_(Main files for this project)_

Main module: _lib/modules/core_

Route Handler: _lib/modules/core/controllers/patient.js_

Patient Model: _lib/modules/core/models/patient.js_

Test: (Good general overview) <i>tests/core/core_api_patient.js</i>

### Helper Modules:
_(From boilerplate I'd made for other projects and have found useful in general)_

**Model Factory -** <i>lib/modules/model_factory</i>

Used to quickly create fake documents for testing purposes.
(See: <i>lib/modules/core/models/fake_factories</i> and <i>tests/</i>)

** DB Utils -** <i>lib/modules/db_utils</i>

Exposes a groom query method that can be used to quickly apply methods like sort, pageLimit and offset to routes and a few other generally useful things to help avoid repeating code. (I put some more specific notes where the method is used in _lib/modules/core/controllers/patient.js_

** Test Utils - ** 
<i>test/test_utils</i>

Spins up a mock version of the server and exposes methods to let you drop and recreate your test db between unit tests.


Medical Database API
====================

### Overview

In this task you'll be creating a simple web service to present a database-driven API which writes and reads simple patient objects.

> If you have any questions email me at michael@parsleyhealth.com.

### Components

1.  **Containers**: Please use a tool like `Docker` (with `Docker Compose`), `Kubernetes` or `Apache Mesos` to structure your database and application containers so that I can easily launch this service. 

2.  **Database**: Use whatever database you find easiest, and most convenient. `PostgreSQL`, `MongoDB` and `MariaDB` are all great possibilities.

3.  **Application**: Write your API handlers using whatever web framework and language you are most comfortable with. `Express / Node.js`, `Play / Java`, `Flask / Python` are some common and popular web frameworks. While REST APIs are the most common, feel free to use GraphQL, Falcor, or another interface if you prefer it.

### Requirements

1.  **CRUD**: Allow basic CRUD operations on a simple object. 

2.  **List**: Allow listing of objects.

3.  **Validation**: Perform validation on incoming create or update requests to insure all fields get the correct data type. Throw an error if an invalid value is provided.

### Fixtures

[Here is a sample / shape of the object](fixtures.md) you should be working with. It describes a simple patient.

### Time limits

Please spend **no more than 3-hours** on this test. If you can't make it perfect in that time, don't worry, just send me what you've accomplished.

Please turn in your results within **72-hours** of the prompt being given. If that falls during the weekend, then please turn it in by Monday.

> Extensions are available, just ask!

### Evaluation & priorities

Within your brief **3 hour time limit** I hope you'll prioritize the following, in this order. Consider this an iterative process — get it working on sound principles first, then refine and polish as time allows.

1.  Make it work!
2.  Clean and clear code (hopefully you didn't sacrifice this to make it work)
3.  Project organization
4.  Planning: tools used, implementation strategy
5.  Code quality details
    -   Type, variable, property checking
    -   Failing fast, for better debugging
6.  Extra polish, concern and care will be noticed

Less important details:

*   The language or framework you use. Please use whatever you are most comfortable with to finish this.

*   Tests are great, but only if you have time.

### Delivery of project

*   Please place your finished source code on GitHub
*   Email me the repository URL and application URL

> If for some reason you would rather not have your code or application out in the open, please send me a zip file of the source code and instructions on to launch and view the finished application.

### Wrap up

When you've finished the test let me know by email: michael@parsleyhealth.com

We will then schedule a short wrap up call to go over your results and the thinking you applied to this project.

### Hints

*   Be efficient! Please don’t reinvent the wheel, use boilerplates or starter projects when they speed up your process and get you to your end goal faster.
