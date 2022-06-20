import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

import * as AWS from 'aws-sdk'
import * as uuid from 'uuid'
import { TodoItem } from '../models/TodoItem'

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const bucketName = process.env.ATTACHMENT_S3_BUCKET
const expiration = process.env.SIGNED_URL_EXPIRATION

export async function getTodosForUser(userId: string) {
  const response = await docClient
    .query({
      TableName: todosTable,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    })
    .promise()
  return response
}

export async function createTodo(userId: string, todo: CreateTodoRequest) {
  const todoId = uuid.v4()

  const newList: TodoItem = {
    todoId,
    userId,
    createdAt: new Date().toISOString(),
    done: false,
    ...todo
  }

  const response = await docClient
    .put({
      TableName: todosTable,
      Item: newList
    })
    .promise()
  return response
}

export async function deleteTodo(userId: string, todoId: string) {
  const response = await docClient
    .delete({
      TableName: todosTable,
      Key: {
        todoId: todoId,
        userId: userId
      }
    })
    .promise()
  return response
}

export async function updateTodo(
  userId: string,
  todoId: string,
  todo: UpdateTodoRequest
) {
  const response = await docClient
    .update({
      TableName: todosTable,
      Key: {
        todoId,
        userId
      },
      ExpressionAttributeNames: { '#N': 'name' },
      UpdateExpression: 'set #N = :name, dueDate = :dueDate, done = :done',
      ExpressionAttributeValues: {
        ':name': todo.name,
        ':dueDate': todo.dueDate,
        ':done': todo.done
      },
      ReturnValues: 'UPDATED_NEW'
    })
    .promise()
  return response
}

const s3 = new AWS.S3({
  signatureVersion: 'v4'
})

export async function createAttachmentPresignedUrl(
  todoId: string,
  userId: string
) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: {
      todoId,
      userId
    },
    Expires: expiration
  })
}
