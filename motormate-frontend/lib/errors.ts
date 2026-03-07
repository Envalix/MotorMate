import { NextResponse } from 'next/server';

export function notFound(msg = 'Not found') {
  return NextResponse.json({ message: msg }, { status: 404 });
}
export function badRequest(msg: string) {
  return NextResponse.json({ message: msg }, { status: 400 });
}
export function unauthorized(msg = 'Unauthorized') {
  return NextResponse.json({ message: msg }, { status: 401 });
}
export function forbidden(msg: string) {
  return NextResponse.json({ message: msg }, { status: 403 });
}
export function conflict(msg: string) {
  return NextResponse.json({ message: msg }, { status: 409 });
}
export function serverError(msg = 'Internal server error') {
  return NextResponse.json({ message: msg }, { status: 500 });
}
