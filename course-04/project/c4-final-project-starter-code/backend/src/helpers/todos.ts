import { TodoDataLayer } from './todosAcess'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import * as uuid from 'uuid'

// TODO: Implement businessLogic
const todos = new TodoDataLayer()

export async function createTodo(
  userId: string,
  todo: CreateTodoRequest
): Promise<TodoItem> {
  const todoId = uuid.v4()
  const createdTodo = todos.createTodoItem({
    userId,
    todoId,
    createdAt: new Date().toISOString(),
    done: false,
    ...todo
  })
  return createdTodo
}

export async function getAllTodos(userId: string): Promise<TodoItem[]> {
  return todos.getTodoList(userId)
}

export async function deleteTodo(
  userId: string,
  todoId: string
): Promise<void> {
  const todo = await todos.getTodoItem(todoId, userId)

  return todos.deleteTodoItem(todo.todoId, userId)
}

export async function updateTodo(
  userId: string,
  todoId: string,
  updateTodoRequest: UpdateTodoRequest
): Promise<void> {
  const todo = await todos.getTodoItem(todoId, userId)

  return todos.updateTodoItem(updateTodoRequest, todo.todoId, userId)
}

export async function setAttachmentUrl(
  userId: string,
  todoId: string,
  imageId: string
): Promise<void> {
  const todo = await todos.getTodoItem(todoId, userId)

  return todos.updateTodoItemAttachment(imageId, todo.todoId, userId)
}
