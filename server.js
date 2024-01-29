
const http = require('http')
const fs = require('fs')
const path = require('path')

http.createServer(server).listen(3500)

async function server(req, res){
  let url = req.url
  if(req.url.includes('favicon')) return;
  try{
    await console.log(url)
    let data = await fs.readFileSync(path.join(__dirname, url), { encoding: 'utf8', flag: 'r'})
    res.write(data)
  }
  catch(e){
    console.log(e)
  }
  await res.end()
}
