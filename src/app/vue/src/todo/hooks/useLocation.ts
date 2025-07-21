import { useState, useEffect } from "vue-function-component";

function useLocation() {
  const [location, setLocation] = useState({
    pathname: window.location.hash.slice(1) || "/",
    search: window.location.search,
    hash: window.location.hash,
    state: null, // 浏览器原生 history.state
  });

  useEffect(() => {
    const handlePopState = () => {
      setLocation({
        pathname: window.location.hash.slice(1) || "/",
        search: window.location.search,
        hash: window.location.hash,
        state: window.history.state,
      });
    };

    // 监听浏览器前进/后退
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const navigate = (to: any, options: any = {}) => {
    if (typeof to === "number") {
      window.history.go(to); // 前进/后退
    } else {
      const { state = null, replace = false } = options;

      if (replace) {
        window.history.replaceState(state, "", to);
      } else {
        window.history.pushState(state, "", to);
      }

      // 手动触发更新（因为 pushState/replaceState 不会触发 popstate）
      setLocation({
        pathname: new URL(to, window.location.href).pathname,
        search: new URL(to, window.location.href).search,
        hash: new URL(to, window.location.href).hash,
        state: state,
      });
    }
  };

  return {
    ...location,
    navigate,
  };
}

export { useLocation };
