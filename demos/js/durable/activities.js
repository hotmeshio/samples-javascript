async function greet(name) {
  return `Hello, ${name}!`;
}

async function saludar(nombre) {
  if (Math.random() > 0.5) throw new Error('¡This is an intentional, random error!');
  return `¡Hola, ${nombre}!`;
}

module.exports = {
  greet,
  saludar
};
