import { useMemo, useCallback } from "vue-function-component";

import { Item } from "./item";
import classnames from "classnames";

import { TOGGLE_ALL } from "../constants";
import { useLocation } from "../hooks/useLocation";

export function Main({ todos, dispatch }) {
  const { pathname: route } = useLocation();

  const visibleTodos = useMemo(
    () =>
      todos.filter((todo) => {
        if (route === "/active") return !todo.completed;

        if (route === "/completed") return todo.completed;

        return todo;
      }),
    [todos, route]
  );

  const toggleAll = useCallback(
    (e) =>
      dispatch({ type: TOGGLE_ALL, payload: { completed: e.target.checked } }),
    [dispatch]
  );

  return (
    <main
      class="main"
      style={{ maxHeight: "50vh", overflow: "auto" }}
      data-testid="main"
    >
      {visibleTodos.length > 0 ? (
        <div class="toggle-all-container">
          <input
            class="toggle-all"
            type="checkbox"
            id="toggle-all"
            data-testid="toggle-all"
            checked={visibleTodos.every((todo) => todo.completed)}
            onChange={toggleAll}
          />
          <label class="toggle-all-label" htmlFor="toggle-all">
            Toggle All Input
          </label>
        </div>
      ) : null}
      <ul class={classnames("todo-list")} data-testid="todo-list">
        {visibleTodos.map((todo, index) => (
          <Item todo={todo} key={todo.id} dispatch={dispatch} index={index} />
        ))}
      </ul>
    </main>
  );
}
