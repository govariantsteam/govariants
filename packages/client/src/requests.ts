const SERVER_URL =
  process.env.NODE_ENV === "production"
    ? "https://govariants-server.herokuapp.com"
    : "http://localhost:3001";

export async function get(path: string) {
  const response = await fetch(SERVER_URL + path);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data);
  }

  return data;
}

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
