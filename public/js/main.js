
var todos = null;

var Todo = Backbone.Model.extend({
    view: null,
    urlRoot: "/todos",
    category: null,
    content: null,
    idAttribute: "_id",
    initialize: function(options) {
        this.category = options.category;
        this.content = options.content;
        this.view = new TodoView({ model: this });
        this.bind('destroy', this.sync, this);
    }
});

var TodoView = Backbone.View.extend({
    model: null,
    $el: null,
    initialize: function(options) {
        this.model.on('destroy', this.remove);
        this.model = options.model;
        this.render();
    },
    render: function() {
        var self = this;
        this.$el = $("<li>" + this.model.content + "</li>");
        this.$el.click(function(event) {
            if ($(this).hasClass('toRemove')) {
                $(this).removeClass('toRemove');
                $(this).stop().fadeOut(function() {
                    self.model.destroy();
                });
            } else {
                $(this).addClass('toRemove');
            }
        });
        $(document).mouseup(function(event) {
            if (!self.$el.is(event.target) && self.$el.has(event.target).length === 0) {
                $(self.$el).removeClass('toRemove');
            }
        });
    },
    remove: function() {
        this.view.$el.remove();
    }
});

var Todos = Backbone.Collection.extend({
    model: Todo,
    url: "/todos",
    view: null,
    initialize: function() {
        this.fetch();
        this.view = new TodosView({collection: this});
    }
});

var TodosView = Backbone.View.extend({
    collection: null,
    $todo: null,
    $topay: null,
    $tobuy: null,
    initialize: function(options) {
        var template = Handlebars.compile($("#category-template").html());
        this.$todo = $(template({ category: 'To Do' }));
        this.$topay = $(template({ category: 'To Pay' }));
        this.$tobuy = $(template({ category: 'To Buy' }));

        this.collection = options.collection;
        this.collection.bind('all', this.render, this);

        $('body').append(this.$todo);
        $('body').append(this.$tobuy);
        $('body').append(this.$topay);

        $('.categoryColumn h4').click(function(event) {
            $('.createTodoRow').not($(this).siblings('.createTodoRow')).hide();
            $(this).find('textarea').val('');
            $(this).siblings('.createTodoRow').toggle();
        });
        $('.createTodoRow input[type=button]').click(function() {
            var text = $(this).siblings('textarea').val();
            var category = $(this).parent().parent().find('h4').html();
            createTodo(text, category);
            $(this).parent().stop().hide(function() {
                $(this).find('textarea').val('');
            });
        });
        $('.createTodoRow textarea').keyup(function(event) {
            if (event.keyCode === 13) {
                var text = $(this).val().slice(0, -1);
                var category = $(this).parent().parent().find('h4').html();
                createTodo(text, category);
                $(this).parent().stop().hide(function() {
                    $(this).find('textarea').val('');
                });
            }
        });
    },
    render: function() {
        var self = this;
        this.$todo.find('ul').children().detach();
        this.$topay.find('ul').children().detach();
        this.$tobuy.find('ul').children().detach();
        this.collection.forEach(function(todo) {
            switch (todo.category) {
                case 'To Pay':
                    self.$topay.find('ul').append(todo.view.$el);
                    break;
                case 'To Buy':
                    self.$tobuy.find('ul').append(todo.view.$el);
                    break;
                default:
                    self.$todo.find('ul').append(todo.view.$el);
            }
        });
    }
});

$(document).ready(function() {
    todos = new Todos();
});

function createTodo(text, category) {
    if (text.slice(-1) !== '.') text += '.';
    var newTodo = new Todo({ content: text, category: category });
    newTodo.save();
    todos.add(newTodo);
}

var socket = io();
socket.on("pull", function() {
    todos.fetch();
});
