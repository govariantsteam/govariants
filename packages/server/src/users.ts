import { getDb } from "./db";
import bcrypt from "bcrypt";
import { UserResponse } from "@ogfcommunity/variants-shared";
import { Collection, WithId, ObjectId } from "mongodb";

export interface GuestUser extends UserResponse {
  token: string;
  login_type: "guest";
}

// Not currently used, but the plan is to use LocalStrategy from Password.js
// eventually, so I want to make sure this type is considered from the start
export interface PersistentUser extends UserResponse {
  username: string;
  password_hash: string;
  login_type: "persistent";
}

function usersCollection(): Collection<GuestUser | PersistentUser> {
  return getDb().db().collection<GuestUser | PersistentUser>("users");
}

export async function getUserByName(username: string): Promise<PersistentUser> {
  const db_user = (await usersCollection().findOne({
    username: { $eq: username },
  })) as WithId<PersistentUser>;

  if (!db_user) {
    return undefined;
  }

  return {
    id: db_user._id.toString(),
    username: db_user.username,
    password_hash: db_user.password_hash,
    login_type: db_user.login_type,
  };
}

export async function getUserBySessionId(
  id: string
): Promise<GuestUser | undefined> {
  const db_user = (await usersCollection().findOne({
    token: { $eq: id },
  })) as WithId<GuestUser>;

  if (!db_user) {
    return undefined;
  }

  return {
    id: db_user._id.toString(),
    token: db_user.token,
    login_type: db_user.login_type,
  };
}

const SALT_ROUNDS = 10;

export async function createUserWithUsernameAndPassword(
  username: string,
  password: string
): Promise<UserResponse> {
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const user: PersistentUser = {
    username,
    password_hash,
    login_type: "persistent",
  };

  const result = await usersCollection().insertOne(user);
  return { id: result.insertedId.toString(), login_type: "persistent" };
}

export async function authenticateUser(
  username: string,
  password: string
): Promise<UserResponse | null> {
  const result = await getUserByName(username);

  if (!result) return null;

  if (await bcrypt.compare(password, result.password_hash)) {
    return { id: result.id.toString(), login_type: "persistent" };
  }

  return null;
}

export async function createUserWithSessionId(id: string): Promise<GuestUser> {
  const result = await usersCollection().insertOne({
    token: id,
    login_type: "guest",
  });
  return { id: result.insertedId.toString(), token: id, login_type: "guest" };
}

export async function getUser(id: string): Promise<UserResponse> {
  const db_user = await usersCollection().findOne({
    _id: new ObjectId(id),
  });

  if (!db_user) {
    return undefined;
  }

  return outwardFacingUser(db_user);
}

function outwardFacingUser(
  db_user: WithId<GuestUser | PersistentUser>
): UserResponse {
  return {
    id: db_user._id.toString(),
    login_type: db_user.login_type,
    ...(db_user.login_type === "persistent" && { username: db_user.username }),
  };
}

export function deleteUser(id: string) {
  usersCollection()
    .deleteOne({
      _id: new ObjectId(id),
    })
    .catch(console.error);
}
