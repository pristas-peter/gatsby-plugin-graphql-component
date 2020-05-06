import { components } from "~gatsby-plugin-graphql-component/async-requires";
import { transform } from "./transform";

// on client entry is called almost as a first lifecycle
export const onClientEntry = async () => {
  // this code patches "development" mode
  if (process.env.NODE_ENV !== `production`) {
    // require is used so the
    // requires can be be removed during production build
    const {
      default: socketIo,
    } = require(`~gatsby-plugin-graphql-component-gatsby-cache/socketIo`);
    const syncRequires = require(`~gatsby-plugin-graphql-component/sync-requires`);
    const { transformSync } = require(`./transform`);

    const emitter = window.___emitter;

    const onResult = ({ result }) => {
      if (result && result.data) {
        Object.assign(
          result.data,
          transformSync({
            json: result.data,
            load: ({ componentChunkName }) =>
              syncRequires.components[componentChunkName],
          })
        );
      }
    };

    // emmitter emits new results on page / static query queries,
    // we will patch the response with components
    emitter.on(`staticQueryResult`, onResult);
    emitter.on(`pageQueryResult`, onResult);

    // we need to initialize socketIo, because core initializes it after this call,
    // but it needs to be initilized when calling loadPage later in the code
    socketIo();
  }

  const loader = window.___loader;

  const { loadPage } = loader;

  // patch query json result in loadPage
  loader.loadPage = async (...args) => {
    const result = await loadPage(...args);

    if (result && result.json && result.json.data) {
      Object.assign(
        result.json.data,
        await transform({
          json: result.json.data,
          load: ({ componentChunkName }) => components[componentChunkName](),
        })
      );
    }

    return result;
  };

  // call loader public method before gatsby core calls underlying private method later after this lifecycle
  // therefore our patched method would not be called
  // network calls are reused in loader internally, so the page won't be loaded twice
  // all other code in core uses this public method, so we should be safe
  return loader.loadPage(window.location.pathname);
};
