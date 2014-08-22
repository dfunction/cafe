var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');

app.use(express.bodyParser());
app.use(express.static(__dirname + '/public'));

// Data

var local_database_name = 'cafe';
var local_database_uri  = 'mongodb://localhost/' + local_database_name
var database_uri = process.env.MONGOLAB_URI || local_database_uri
mongoose.connect(database_uri);

var Todo = mongoose.model('Todo', { category: String, content: String });
// Routes

app.get('/todos', function(req, res) {
  var todos = [];
  Todo.find({}, function(err, todos) {
    res.send(todos);
  })
});

app.put('/todos', function(req, res) {
  var newTodo = new Todo(req.body);
  newTodo.save(function(err, product) {
    res.send({ id: product._id });
    sendPullRequest();
  });
});

app.post('/todos', function(req, res) {
  var newTodo = new Todo(req.body);
  newTodo.save(function(err, product) {
    res.send({ id: product._id });
    sendPullRequest();
  });
});

app.delete('/todos', function(req, res) {
  Todo.remove({}, function() {
    res.send();
    sendPullRequest();
  });
});

app.get('/todos/:id', function(req, res) {
  Todo.findById(req.params.id, function(err, todo) {
      res.send(todo);
  });
});

app.put('/todos/:id', function(req, res) {
  Todo.update({_id: req.params.id}, req.param('todo'), function() {
    res.send();
    sendPullRequest();
  });
});

app.post('/todos/:id', function(req, res) {
  Todo.update({_id: req.params.id}, req.param('todo'), function() {
    res.send();
    sendPullRequest();
  });
});

app.delete('/todos/:id', function(req, res) {
  Todo.remove({_id: req.params.id}, function(err) {
    res.send();
    sendPullRequest();
  });
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
