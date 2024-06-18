async function greet(name: string): Promise<string> {
  return `Hello, ${name}!`;
}

async function saludar(nombre: string): Promise<string> {
  if (Math.random() > 0.5) {
    throw new Error('¡This is an intentional, random error!');
  }
  return `¡Hola, ${nombre}!`;
}

export { greet, saludar };
