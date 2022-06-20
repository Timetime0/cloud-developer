import * as AWS from 'aws-sdk'
// import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic

export class TodoDataLayer {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly todoTable = process.env.TODOS_TABLE,
    private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET
  ) {
    console.log(`docClient ==> \n ${JSON.stringify(docClient)}`)
    console.log(`todoTable ==> \n ${todoTable}`)
  }
  //Create TODO
  public async createTodoItem(todo: TodoItem): Promise<TodoItem> {
    logger.info(`Creating a ToDo..`)
    await this.docClient
      .put({
        TableName: this.todoTable,
        Item: todo
      })
      .promise()
    return todo
  }
  //Get TODO
  public async getTodoItem(todoId: string, userId: string): Promise<TodoItem> {
    logger.info(`Getting TODO for: ${userId}`)
    const pull = await this.docClient
      .query({
        TableName: this.todoTable,
        KeyConditionExpression: 'userId = :userId AND todoId = :todoId',
        ExpressionAttributeValues: { ':userId': userId, ':todoId': todoId }
      })
      .promise()
    return pull.Items[0] as TodoItem
  }
  //Get TODO list
  public async getTodoList(userId: string): Promise<TodoItem[]> {
    logger.info(`Getting TODO list for: ${userId}`)
    const result = await this.docClient
      .query({
        TableName: this.todoTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
      .promise()
    return result.Items as TodoItem[]
  }
  //Update TODO item
  public async updateTodoItem(
    todo: TodoUpdate,
    todoId: string,
    userId: string
  ) {
    logger.info('Updating TODO for: ', { user: userId, todo })
    await this.docClient
      .update({
        TableName: this.todoTable,
        Key: { userId: userId, todoId: todoId },
        UpdateExpression: 'set #name = :n, dueDate = :dd, done = :d',
        ExpressionAttributeNames: { '#name': 'name' },
        ExpressionAttributeValues: {
          ':dd': todo.dueDate,
          ':d': todo.done,
          ':n': todo.name
        },
        ReturnValues: 'UPDATED_NEW'
      })
      .promise()
  }

  //Delete TODO item
  public async deleteTodoItem(todoId: string, userId: string) {
    logger.info(`Deleting TODO for: ${userId}`)
    await this.docClient
      .delete({
        TableName: this.todoTable,
        Key: { userId: userId, todoId: todoId }
      })
      .promise()
  }

  public async updateTodoItemAttachment(
    imageId: string,
    todoId: string,
    userId: string
  ) {
    const attachmentUrl = `https://${this.bucketName}.s3.amazonaws.com/${imageId}`

    logger.info(`Updating TODO item image URL for: ${userId}`)
    await this.docClient
      .update({
        TableName: this.todoTable,
        Key: { userId: userId, todoId: todoId },
        UpdateExpression: 'set attachmentUrl = :attachmentUrl',
        ExpressionAttributeValues: { ':attachmentUrl': attachmentUrl },
        ReturnValues: 'UPDATED_NEW'
      })
      .promise()
  }
}
