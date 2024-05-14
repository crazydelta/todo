const express = require('express')
const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const path = require('path')
const dbpath = path.join(__dirname, 'todoApplication.db')

let db = null

const initialize = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server running')
    })
  } catch (e) {
    console.log(e)
    process.exit(1)
  }
}

initialize()

//other
const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

const hastodoProperty = requestQuery => {
  return requestQuery.todo !== undefined
}

const convertDbObjectToResponseObject = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
  }
}

//api1

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`
      break
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`
      break
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`
  }

  data = await db.all(getTodosQuery)
  response.send(data)
})

//api2

app.get('/todos/:todoId/', async (rq, rp) => {
  const {todoId} = rq.params
  const qu = `select * from todo where id= ${todoId};`
  const d = await db.get(qu)
  rp.send(convertDbObjectToResponseObject(d))
})

//api3

app.post('/todos/', async (rq, rp) => {
  const {id, todo, priority, status} = rq.body
  const qu = `insert into todo (id, todo, priority, status) values (${id},'${todo}','${priority}','${status}');`
  const d = await db.run(qu)
  rp.send('Todo Successfully Added')
})

//api4

app.put('/todos/:todoId/', async (rq, rp) => {
  const {todoId} = rq.params
  const {todo, priority, status} = rq.body
  const search_q = ''
  let getTodosQuery = ''
  switch (true) {
    case hasPriorityProperty(rq.query):
      getTodosQuery = `update todo set priority= "${priority}" where id= ${todoId};`
      break
    case hasStatusProperty(rq.query):
      getTodosQuery = `update todo set status= "${status}" where id= ${todoId};`
      break
    case hastodoProperty(rq.query):
      getTodosQuery = ` update todo set todo= "${todo}" where id= ${todoId};`
      break
    default:
      getTodosQuery = `
          SELECT
            *
          FROM
            todo 
          WHERE
            todo LIKE '%${search_q}%';`
  }

  let data = ''
  try {
    data = await db.run(getTodosQuery)
    if (hasStatusProperty(rq.query)) {
      rp.send('Status updated')
    } else if (hasPriorityProperty(rq.query)) {
      rp.send('Priority updated')
    } else if (hastodoProperty(rq.query)) {
      rp.send('Todo updated')
    } else {
      rp.send(data.rows[0])
    }
  } catch (error) {
    rp.status(500).send(error.message)
  }
})

//api5

app.delete('/todos/:todoId/', async (rq, rp) => {
  const {todoId} = rq.params
  const qu = `delete from todo where id= ${todoId};`
  const d = await db.get(qu)
  rp.send('Todo Deleted')
})

module.exports = app
