import io from "socket.io-client";
import { useStore } from "./stores/user";

const SERVER_ORIGIN =
  process.env.NODE_ENV === "production"
    ? window.location.origin
    : "http://localhost:3001";
const SERVER_PATH_PREFIX = "/api";

async function requestImpl(method: string, path: string, json?: object) {
  const headers = new Headers();
  headers.append("Origin", SERVER_ORIGIN); // TODO: Is this necessary?
  headers.append("Content-Type", "application/json");
  const csfr_token = useStore().csrf_token;
  if (csfr_token) {
    headers.append("CSRF-Token", csfr_token);
  }
  const response = await fetch(SERVER_PATH_PREFIX + path, {
    method,
    ...(json ? { body: JSON.stringify(json) } : null),
    headers,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data;
}

// There's probably a way to get types into the APIs, but for now just have to
// silence this warning.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoPayloadRequest = (path: string) => Promise<any>;

export const get: NoPayloadRequest = requestImpl.bind(undefined, "get");
export const post = requestImpl.bind(undefined, "post");
export const put = requestImpl.bind(undefined, "put");
export const del: NoPayloadRequest = requestImpl.bind(undefined, "delete");

export const socket = io(SERVER_ORIGIN);
