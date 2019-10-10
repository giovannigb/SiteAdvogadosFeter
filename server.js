const express = require('express')
const app = express()

app.render('/html/index', {
    title: 'Homepage'
  });

// serve static files from the `public` folder
app.use(express.static(__dirname + '/HTML'));

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})