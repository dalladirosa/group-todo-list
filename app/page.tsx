'use client';

import { useState, useEffect } from 'react';
import '@aws-amplify/ui-react/styles.css';
import { client } from '@/lib/api';
import type { Schema } from '@/amplify/data/resource';
import './../app/app.css';
import styles from './page.module.css';
import Sidebar from '@/components/sidebar';
import { deleteUser } from 'aws-amplify/auth';

export default function App() {
  const [todos, setTodos] = useState<Array<Schema['Todo']['type']>>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  function createTodo() {
    const content = window.prompt('Todo content');
    if (content && selectedGroupId) {
      client.models.Todo.create({
        content,
        groupId: selectedGroupId
      });
    } else if (!selectedGroupId) {
      alert('Please select a group first!');
    }
  }

  async function listTodos() {
    if (selectedGroupId) {
      client.models.Todo.observeQuery({
        filter: {
          groupId: { eq: selectedGroupId }
        }
      }).subscribe({
        next: (data) => setTodos([...data.items])
      });
    } else {
      setTodos([]);
    }
  }

  useEffect(() => {
    listTodos();
  }, [selectedGroupId]);

  async function deleteTodo(todoId: string) {
    await client.models.Todo.delete({
      id: todoId
    });
  }

  return (
    <div className={styles.container}>
      <Sidebar onGroupSelect={setSelectedGroupId} />
      <main className={styles.main}>
        <button onClick={createTodo}>+ new</button>
        <ul>
          {todos.map((todo) => (
            <li key={todo.id} className={styles.todo}>
              <span>{todo.content}</span>
              <button onClick={() => deleteTodo(todo.id)}>🗑️</button>
            </li>
          ))}
        </ul>
        <div>
          🥳 App successfully hosted. Try creating a new todo.
          <br />
        </div>
      </main>
    </div>
  );
}
