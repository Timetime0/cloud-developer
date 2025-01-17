import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader,
  Pagination,
  PaginationProps
} from 'semantic-ui-react'

import { createTodo, deleteTodo, getTodos, patchTodo } from '../api/todos-api'
import Auth from '../auth/Auth'
import { Todo } from '../types/Todo'

interface TodosProps {
  auth: Auth
  history: History
}

interface TodosState {
  todos: Todo[]
  todosPage: Todo[]
  newTodoName: string
  loadingTodos: boolean
  begin: number
  end: number
  activePage: number
}

export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    todos: [],
    todosPage: [],
    newTodoName: '',
    loadingTodos: true,
    begin: 0,
    end: 5,
    activePage: 1
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoName: event.target.value })
  }

  onEditButtonClick = (todoId: string) => {
    this.props.history.push(`/todos/${todoId}/edit`)
  }

  onTodoCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const dueDate = this.calculateDueDate()
      const newTodo = await createTodo(this.props.auth.getIdToken(), {
        name: this.state.newTodoName.trim(),
        dueDate
      })
      this.setState({
        todos: [...this.state.todos, newTodo],
        newTodoName: ''
      })
      console.log('cronTodoCreateeate', this.state)
    } catch {
      alert('Todo creation failed')
    }
  }

  onTodoDelete = async (todoId: string) => {
    try {
      await deleteTodo(this.props.auth.getIdToken(), todoId)
      this.setState({
        todos: this.state.todos.filter((todo) => todo.todoId !== todoId)
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  onTodoCheck = async (pos: number) => {
    try {
      const todo = this.state.todos[pos]
      await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: !todo.done
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { done: { $set: !todo.done } }
        })
      })
      this.setState({
        todosPage: this.state.todos.slice(this.state.begin, this.state.end)
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const todos = await getTodos(this.props.auth.getIdToken())
      this.setState({
        todos,
        loadingTodos: false,
        todosPage: todos.slice(this.state.begin, this.state.end)
      })
      console.log(this.state)
    } catch (e) {
      alert(`Failed to fetch todos: ${e}`)
    }
  }

  componentDidUpdate(prevProps: TodosProps, prevState: TodosState) {
    if (prevState.todos.length !== this.state.todos.length) {
      this.setState({
        todosPage: this.state.todos.slice(this.state.begin, this.state.end)
      })
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">TODOs</Header>

        {this.renderCreateTodoInput()}

        {this.renderTodos()}
      </div>
    )
  }

  renderCreateTodoInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'New task',
              onClick: this.onTodoCreate
            }}
            value={this.state.newTodoName}
            fluid
            actionPosition="left"
            placeholder="To change the world..."
            onChange={this.handleNameChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderTodos() {
    if (this.state.loadingTodos) {
      return this.renderLoading()
    }

    return this.renderTodosList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading TODOs
        </Loader>
      </Grid.Row>
    )
  }

  async btnClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    data: PaginationProps
  ) {
    console.log('btnClick')
    await this.setState({ activePage: data.activePage as number })
    await this.setState({ begin: this.state.activePage * 5 - 5 })
    await this.setState({ end: this.state.activePage * 5 })
    this.setState({
      todosPage: this.state.todos.slice(this.state.begin, this.state.end)
    })
  }

  renderTodosList() {
    return (
      <div>
        <Grid padded>
          {this.state.todosPage?.map((todo, pos) => {
            return (
              <Grid.Row key={todo.todoId}>
                <Grid.Column width={1} verticalAlign="middle">
                  <Checkbox
                    onChange={() => this.onTodoCheck(pos)}
                    checked={todo.done}
                  />
                </Grid.Column>
                <Grid.Column width={10} verticalAlign="middle">
                  {todo.name}
                </Grid.Column>
                <Grid.Column width={3} floated="right">
                  {todo.dueDate}
                </Grid.Column>
                <Grid.Column width={1} floated="right">
                  <Button
                    icon
                    color="blue"
                    onClick={() => this.onEditButtonClick(todo.todoId)}
                  >
                    <Icon name="pencil" />
                  </Button>
                </Grid.Column>
                <Grid.Column width={1} floated="right">
                  <Button
                    icon
                    color="red"
                    onClick={() => this.onTodoDelete(todo.todoId)}
                  >
                    <Icon name="delete" />
                  </Button>
                </Grid.Column>
                {todo.attachmentUrl && (
                  <Image src={todo.attachmentUrl} size="small" wrapped />
                )}
                <Grid.Column width={16}>
                  <Divider />
                </Grid.Column>
              </Grid.Row>
            )
          })}
          <Grid.Row>
            <Grid.Column width={1} divided={true.toString()}>
              <Pagination
                defaultActivePage={1}
                totalPages={Math.ceil(this.state.todos.length / 5)}
                onPageChange={(event, data) => this.btnClick(event, data)}
              />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    )
  }

  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}
