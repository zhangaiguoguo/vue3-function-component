import { useState, useCallback, startTransition } from "vue-function-component";
import classnames from "classnames";

import { Input } from "./input";

import { TOGGLE_ITEM, REMOVE_ITEM, UPDATE_ITEM } from "../constants";

export const Item = function Item({ todo, dispatch, index }) {
  const [isWritable, setIsWritable] = useState(false);
  const { title, completed, id } = todo;

  const toggleItem = useCallback(() => {
    dispatch({ type: TOGGLE_ITEM, payload: { id } });
  }, [dispatch]);
  const removeItem = useCallback(
    () => dispatch({ type: REMOVE_ITEM, payload: { id } }),
    [dispatch]
  );
  const updateItem = useCallback(
    (id, title) => dispatch({ type: UPDATE_ITEM, payload: { id, title } }),
    [dispatch]
  );

  const handleDoubleClick = useCallback(() => {
    startTransition(() => {
      setIsWritable(true);
    });
  }, []);

  const handleBlur = useCallback(() => {
    setIsWritable(false);
  }, []);

  const handleUpdate = useCallback(
    (title) => {
      if (title.length === 0) removeItem(id);
      else updateItem(id, title);

      setIsWritable(false);
    },
    [id, removeItem, updateItem]
  );

  return (
    <li
      class={classnames({ completed: todo.completed })}
      data-testid="todo-item"
    >
      {isWritable ? (
        <Input
          onSubmit={handleUpdate}
          defaultValue={title}
          onBlur={handleBlur}
        />
      ) : (
        <>
          <input
            class="toggle"
            type="checkbox"
            data-testid="todo-item-toggle"
            checked={completed}
            style={{ left: 0 }}
            onChange={toggleItem}
          />
          <label data-testid="todo-item-label" onDblclick={handleDoubleClick}>
            {title}
          </label>
          <button
            class="destroy"
            data-testid="todo-item-button"
            onClick={removeItem}
          />
        </>
      )}
    </li>
  );
};
