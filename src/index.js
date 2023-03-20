import express from 'express';
import axios from 'axios';
import responseTime from 'response-time';
import redis from 'redis';
import { promisify } from 'util';

const client = redis.createClient({
  host: '127.0.0.1',
  port: 6379,
})

const GET_ASYNC = promisify(client.get).bind(client);  // Lo que hace es convertir el método get de Redis en una promesa para poder usar async/await
const SET_ASYNC = promisify(client.set).bind(client);  // Lo que hace es convertir el método get de Redis en una promesa para poder usar async/await

client.on('connect', () => {
  console.log('Conectado a Redis');
});

client.on('error', (err) => {
  console.log('Error de conexión con Redis', err);
});

client.on('ready', () => {
  console.log('Redis listo para usarse');
});

client.on('end', () => {
  console.log('Desconectado de Redis');
});

const app = express();

app.use(responseTime()); // Esto es para medir el tiempo de respuesta (Ejemplo: X-Response-Time: 363.661ms)

app.get('/characters', async (req, res) => {

  try {
    const replyGet = await GET_ASYNC('characters'); // Primero busca en Redis si hay algo guardado con la key 'characters'
    if (replyGet) { // Si lo encuentra, lo devuelve
      return res.json(JSON.parse(replyGet));
    }
    const { data } = await axios.get('https://rickandmortyapi.com/api/character');
    const replySet = await SET_ASYNC('characters', JSON.stringify(data)); // Si no lo encuentra, lo guarda en Redis
    console.log(replySet);
    res.json(data);
  } catch (error) {
    console.log(error);
  }
  /*
  Manera Antigua:
  client.get('characters', async (err, reply) => { // Primero busca en Redis si hay algo guardado con la key 'characters'
    if (reply) { // Si lo encuentra, lo devuelve
      return res.json(JSON.parse(reply));
    }

    const { data } = await axios.get('https://rickandmortyapi.com/api/character');

    client.set('characters', JSON.stringify(data), (err, reply) => { // Si no lo encuentra, lo guarda en Redis
      if (err) {
        console.log(err);
      }
      console.log(reply);
      res.json(data);
    });
  });*/
});

app.get('/characters/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const replyGet = await GET_ASYNC(`character-${id}`); // Primero busca en Redis si hay algo guardado con la key 'character-${id}'
    if (replyGet) { // Si lo encuentra, lo devuelve
      return res.json(JSON.parse(replyGet));
    }

    const { data } = await axios.get(`https://rickandmortyapi.com/api/character/${id}`);
    const replySet = await SET_ASYNC(`character-${id}`, JSON.stringify(data)); // Si no lo encuentra, lo guarda en Redis
    console.log(replySet);
    return res.json(data);

  } catch (error) {
    console.log(error.message);
    return res.status(404).json({ message: 'Personaje no encontrado' });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});