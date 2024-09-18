const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbpath = path.join(__dirname, 'covid19India.db')
const app = express()
app.use(express.json())
let db = null

const initializeDBAAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}
initializeDBAAndServer()

const stateobject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const districtobject = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

const reportobject = dbObject => {
  return {
    totalCases: dbObject.cases,
    totalCured: dbObject.cured,
    totalActive: dbObject.active,
    totalDeaths: dbObject.deaths,
  }
}

app.get('/states/', async (request, response) => {
  const getlistquery = `
    select * from state order by state_id;`
  const statelist = await db.all(getlistquery)
  response.send(statelist.map(eachobject => stateobject(eachobject)))
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getstatequery = `
    select * from state where state_id=${stateId};`
  const list = await db.get(getstatequery)
  response.send(stateobject(list))
})

app.post('/districts/', async (request, response) => {
  const createdistrict = request.body
  const {districtName, stateId, cases, cured, active, deaths} = createdistrict
  const newdistrict = `insert into district(
            district_name,state_id,cases,cured,active,deaths) values(
                '${districtName}',
                ${stateId},
                ${cases},
                ${cured},
                ${active},
                ${deaths});`
  await db.run(newdistrict)
  response.send('District Successfully Added')
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getdistrict = `
    select * from district where district_id=${districtId};`
  const newdistrict = await db.get(getdistrict)
  response.send(districtobject(newdistrict))
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getdeletedquery = `
    delete from district where district_id=${districtId};`
  await db.run(getdeletedquery)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtdetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtdetails
  const upadteddistrict = `
        update district set 
        district_name='${districtName}',
        state_id=${stateId},
        cases=${cases},
        cured=${cured},
        active=${active},
        deaths=${deaths} 
        where district_id=${districtId};`
  await db.run(upadteddistrict)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getstatereport = `
    select sum(cases) as totalCases,
    sum(cured) as totalCured,
    sum(active) as totalActive,
    sum(deaths) as totalDeaths from district where state_id=${stateId};`
  const stats = await db.get(getstatereport)

  response.send({
    totalCases: stats.totalCases,
    totalCured: stats.totalCured,
    totalActive: stats.totalActive,
    totalDeaths: stats.totalDeaths,
  })
})

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getstatedetails = `
    select state_id from district where district_id=${districtId};`

  const statename = await db.get(getstatedetails)
  const statenamequery = `
  select state_name as stateName from state where state_id=${statename.state_id};`
  const statenameresponse = await db.get(statenamequery)
  response.send(statenameresponse)
})

module.exports = app;
