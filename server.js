var express = require('express');
var app = express();
var http = require('http').Server(app);
var jf = require('jsonfile');
var io = require('socket.io')(http);

app.use(express.bodyParser());
app.use(express.static(__dirname + '/public'));

// Data

var file = './data.json';
var todosDB = jf.readFileSync(file);
var nextId = 0;

setInterval(function() {
    jf.writeFileSync(file, todosDB);
}, 1000);

// Routes

app.get('/todos', function(req, res) {
  var todos = [];
  todosDB.forEach(function(todo, i, array) {
    if (todo != null) {
      todos.push(todo);
    }
  });
  res.send(todos);
  console.log('get', todosDB);
});

app.put('/todos', function(req, res) {
  var todo = req.body;
  var id = nextId++;
  todosDB[id] = todo;
  todosDB[id].id = id;
  res.send({ id: id });
  sendPullRequest();
});

app.post('/todos', function(req, res) {
  var todo = req.body;
  var id = nextId++;
  todosDB[id] = todo;
  todosDB[id].id = id;
  res.send({ id: id });
  sendPullRequest();
});

app.delete('/todos', function(req, res) {
  todosDB = [];
  res.send();
  sendPullRequest();
});

app.get('/todos/:id', function(req, res) {
  res.send(todosDB[req.params.id]);
});

app.put('/todos/:id', function(req, res) {
  todosDB[req.params.id] = req.param('todo');
  res.send();
  sendPullRequest();
});

app.post('/todos/:id', function(req, res) {
  todosDB[req.params.id] = req.param('todo');
  res.send();
  sendPullRequest();
});

app.delete('/todos/:id', function(req, res) {
  delete todosDB[req.params.id];
  console.log('delete', req.params, todosDB);
  res.send();
  sendPullRequest();
});

// HTTP server
http.listen(3000, function(){
  console.log('HTTP server listening on *:3000');
});

// Socket.io server
var sockets = [];
io.on('connect', function(socket){
  console.log('IO: a user connected');
  sockets.push(socket);
  socket.on('disconnect', function(){
    var index = sockets.indexOf(socket);
    if (~index) sockets.splice(index, 1);
    console.log('IO: a user disconnected');
  });
});

// Call pull
function sendPullRequest() {
    sockets.forEach(function (s) {
      s.emit("pull");
    });
}
