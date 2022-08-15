export const SERVER_URL =
  process.env.NODE_ENV === "production"
    ? window.location.origin
    : "http://localhost:3001";

export async function get(path: string) {
  const response = await fetch(SERVER_URL + path);
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
  headers.append("Origin", SERVER_URL);
  headers.append("Content-Type", "application/json");
  const response = await fetch(SERVER_URL + path, {
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
