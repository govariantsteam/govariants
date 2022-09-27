import io from "socket.io-client";

const SERVER_ORIGIN =
  process.env.NODE_ENV === "production"
    ? window.location.origin
    : "http://localhost:3001";
const SERVER_PATH_PREFIX = "/api";

export async function get(path: string) {
  const response = await fetch(SERVER_PATH_PREFIX + path);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data);
  }

  return data;
}

// There's probably a way to get types into the APIs, but for now just have to
// silence this warning.
// eslint-disable-next-line
export async function post(path: string, json: any) {
  const headers = new Headers();
  headers.append("Origin", SERVER_ORIGIN); // TODO: Is this necessary?
  headers.append("Content-Type", "application/json");
  const response = await fetch(SERVER_PATH_PREFIX + path, {
    method: "post",
    body: JSON.stringify(json),
    headers,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data);
  }

  return data;
}

export const socket = io(SERVER_ORIGIN);
