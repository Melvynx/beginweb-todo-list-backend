import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import fs from "fs/promises";
import { initDB } from "./db.js";

const app = express();
const port = 3000;

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));
initDB();

async function getTodos() {
  const todos = await fs.readFile("todos.json", "utf-8");
  const parsedTodos = JSON.parse(todos);
  return parsedTodos.todos;
}

async function updateTodos(newTodos) {
  const newTodosObj = { todos: newTodos };
  const newTodosStr = JSON.stringify(newTodosObj, null, 2);
  await fs.writeFile("todos.json", newTodosStr);
  return newTodos;
}

app.get("/todos", async (req, res) => {
  // HTML File
  res.setHeader("Content-Type", "application/json");
  const todos = await getTodos();
  res.send({ todos });
});

app.post("/todos", async (req, res) => {
  const newTodo = {
    text: req.body.todo.text,
    completed: req.body.todo.completed,
    id: Date.now(),
  };
  const newTodos = [...(await getTodos()), newTodo];
  updateTodos(newTodos);
  res.setHeader("Content-Type", "application/json");
  res.send({ todo: newTodo });
});

app.patch("/todos/:id", async (req, res) => {
  const todoId = req.params.id;
  const body = req.body;

  // body = { todo: completed, text }
  if (!("todo" in body)) {
    res.status(400);
    res.send("Invalid object, must have todo in the body");
  }

  if (body.todo.completed && typeof body.todo.completed !== "boolean") {
    res.status(400);
    res.send("Invalid 'todo.completed' : must be a boolean");
    return;
  }

  if (body.todo.text && typeof body.todo.text !== "string") {
    res.status(400);
    res.send("Invalid 'todo.text' : must be a string");
    return;
  }

  const todos = await getTodos();
  const todoToUpdate = todos.find((t) => t.id === Number(todoId));

  if (!todoToUpdate) {
    res.status(400);
    res.send(`No todo with id "${todoId}"`);
  }

  if (body.todo.completed !== undefined) {
    todoToUpdate.completed = body.todo.completed;
  }
  if (body.todo.text !== undefined) {
    todoToUpdate.text = body.todo.text;
  }

  updateTodos([...todos]);

  res.status(200);
  res.setHeader("Content-Type", "application/json");
  res.send({
    todo: todoToUpdate,
  });
});

app.delete("/todos/:id", async (req, res) => {
  const todoId = req.params.id;

  const todos = await getTodos();
  const newTodos = todos.filter((todo) => todo.id !== Number(todoId));
  updateTodos(newTodos);

  const deletedTodo = todos.find((t) => t.id === Number(todoId));

  res.status(200);
  res.setHeader("Content-Type", "application/json");
  res.send({ todo: deletedTodo });
});

app.listen(port, () => {
  console.log(`Running on http://localhost:${port}`);
});
