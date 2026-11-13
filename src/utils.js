export function greet(name) {
  // A comment a minifier will drop
  const message = "Hello, " + name;
  return message;
}

export function neverCalled() {
  return "I should be removed by tree shaking";
}
