const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { formatTime } = require('./helpers');

const SECRET_KEY = 'SECRET'; // Define a secret key for JWT token generation


const app = express();
app.use(cors());

// Create a database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'garage',
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to MySQL database.');
});

// API Routes for testing
app.get('/api/dados', (req, res) => {
    const sql = 'SELECT * FROM tabela';
    db.query(sql, (err, result) => {
        if (err) {
            throw err;
        }
        res.send(result);
    });
});

// testing connection 
app.get('/api/teste-conexao', (req, res) => {
    const sql = 'SELECT 1 + 1 AS resultado';
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error querying the database.' });
        }
        res.json({ resultado: result[0].resultado });
    });
});

// route to get brands
app.get('/api/marcas', (req, res) => {
    const sql = 'SELECT * FROM brand';
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error querying the database.' });
        }
        res.json(result);
    });
});

// Middleware to handle requests
app.use(bodyParser.json());

// Route to add a new brand
app.post('/api/marcas', (req, res) => {
    const { brandName } = req.body;

    // Check if the brand name has been provided
    if (!brandName) {
        return res.status(400).json({ error: 'Brand name is required.' });
    }

    // Insert the new brand into the database
    const query = 'INSERT INTO brand (brand_name) VALUES (?)';
    db.query(query, [brandName], (err, result) => {
        if (err) {
            console.error('Error adding the brand:', err);
            return res.status(500).json({ error: 'Error adding the brand.' });
        }

        // Return the newly added brand with the ID generated by the database
        const newBrand = { id: result.insertId, brandName };
        return res.status(201).json(newBrand);
    });
});

// Route to register a new user
app.post('/api/register', (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check if the email or phone is already registered in the database
    const checkQuery = 'SELECT * FROM login WHERE email = ? OR phone = ?';
    db.query(checkQuery, [email, phone], (checkErr, checkResult) => {
        if (checkErr) {
            console.error('Error verifying the user:', checkErr);
            return res.status(500).json({ error: 'Error verifying the user.' });
        }

        // If a user with the same email or phone already exists, return an error message
        if (checkResult.length > 0) {
            return res.status(409).json({ message: 'Email or phone is already registered.' });
        }

        // Insert the new user into the "login" table
        const insertQuery = 'INSERT INTO login (name, email, phone, pass) VALUES (?, ?, ?, ?)';
        db.query(insertQuery, [name, email, phone, password], (insertErr, insertResult) => {
            if (insertErr) {
                console.error('Error registering the user:', insertErr);
                return res.status(500).json({ error: 'Error registering the user.' });
            }

            // Return the newly registered user with the ID generated by the database
            const newUser = { id: insertResult.insertId, name, email, phone };
            return res.status(201).json(newUser);
        });
    });
});

// Route to verify login based on email and password
app.post('/api/login/verify', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Check if the email and password match a user in the "login" table
    const query = 'SELECT * FROM login WHERE email = ? AND pass = ?';
    db.query(query, [email, password], (err, result) => {
        if (err) {
            console.error('Error verifying login:', err);
            return res.status(500).json({ error: 'Error verifying login.' });
        }

        if (result.length === 0) {
            // If there is no match, it means the login does not exist
            return res.status(404).json({ message: 'Login not found.' });
        }

        // If there is a match, it means the login exists
        return res.status(200).json({ message: 'Login successful.' });
    });
});

// POST route to receive data from the booking form
app.post('/api/bookings', (req, res) => {
    const { name, address, email, phone, vehicle, vehicle_type, brand, date, fuel_type, comments, booking_time, booking_type, cost } = req.body;

    // Format the time to HH:mm:ss format using the formatTime function
    const formattedTime = formatTime(booking_time);

    // Check if all mandatory fields are provided
    if (!name || !address || !email || !phone || !vehicle || !vehicle_type || !brand || !date || !fuel_type || !comments || !booking_time || !booking_type || !cost) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check if the selected date is a Sunday (the value returned by the getDay() method is 0 for Sunday, 1 for Monday, and so on)
    const selectedDate = new Date(date);
    if (selectedDate.getDay() === 0) {
        return res.status(400).json({ error: 'Reservations are not possible on Sundays.' });
    }

    // Set the default status_id to 1
    const statusId = 1;

    // Insert the new booking into the "bookings" table with the default status_id
    const query = 'INSERT INTO bookings (name, address, email, phone, vehicle, vehicle_type, brand, date, fuel_type, comments, booking_time, status_id, booking_type, cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [name, address, email, phone, vehicle, vehicle_type, brand, date, fuel_type, comments, booking_time, statusId, booking_type, cost], (err, result) => {
        if (err) {
            console.error('Error adding the booking:', err);
            return res.status(500).json({ error: 'Error adding the booking.' });
        }

        // Return the newly added booking with the ID generated by the database
        const newBooking = {
            id: result.insertId,
            name,
            address,
            email,
            phone,
            vehicle,
            vehicle_type,
            brand,
            date,
            fuel_type,
            comments,
            booking_time: formattedTime,
            status_id: statusId,
            booking_type,
            cost,
        };
        return res.status(201).json(newBooking);
    });
});


// Route to fetch data from the "booking_details" table
app.get('/api/bookings_details', (req, res) => {
    const sql = 'SELECT * FROM booking_details';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching data from the booking_details table:', err);
            return res.status(500).json({ error: 'Error fetching data from the booking_details table.' });
        }
        res.json(result);
    });
});

// Route to fetch data from the "bookings" table
app.get('/api/bookings', (req, res) => {
    const sql = 'SELECT * FROM bookings'; 
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching data from the bookings table:', err);
            return res.status(500).json({ error: 'Error fetching data from the bookings table.' });
        }
        res.json(result);
    });
});

// // Rota de login
// app.post('/api/login', (req, res) => {
//     const email = req.body.email;
//     const password = req.body.password;

//     // Simulação da consulta ao banco de dados para verificar o usuário
//     const user = users.find((u) => u.email === email && u.password === password);

//     if (!user) {
//         return res.status(401).json({ error: 'Credenciais inválidas.' });
//     }

//     // Exemplo de geração do token JWT
//     const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: '1h' });
//     res.json({ token });
// });

// Middleware para verificar o token de autenticação


function verifyToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token de autenticação inválido.' });
        }
        req.user = user;
        next();
    });
}

// Rota protegida para obter informações do usuário logado
app.get('/api/user-info', verifyToken, (req, res) => {
    const userEmail = req.user.email;

    res.json({ email: userEmail, otherInfo: '...', moreInfo: '...' });
});


// app.post('/api/login', (req, res) => {
//     const { email, pass } = req.body;

//     if (!email || !pass) {
//         return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
//     }

//     // Verifique o e-mail e senha no banco de dados (substitua 'login' pelo nome correto da tabela)
//     const sql = 'SELECT * FROM login WHERE email = ? AND pass = ?';
//     db.query(sql, [email, pass], (err, result) => {
//         if (err) {
//             return res.status(500).json({ error: 'Erro ao consultar o banco de dados.' });
//         }

//         if (result.length === 0) {
//             return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
//         }

//         // Verifique se o usuário é um administrador (substitua 'role' pelo nome correto do campo que representa o papel/role)
//         const user = { id: result[0].id, email: result[0].email, role: result[0].role };
//         const isAdmin = result[0].role === 'admin';

//         const token = jwt.sign(user, SECRET_KEY, { expiresIn: '1h' });

//         return res.json({ token, isAdmin });
//     });
// });

// Rota protegida para a página de administração
app.get('/api/admin', verifyToken, (req, res) => {
    if (req.user && req.user.role === 'admin') {

        return res.json({ message: 'Bem-vindo à página de administração.' });
    } else {
        return res.status(403).json({ error: 'Acesso não autorizado.' });
    }
});

// Create a route to get the booking status of the logged-in user
app.get('/api/bookings/status', (req, res) => {
    const userEmail = req.query.email; // Get the logged-in user's email from the URL parameter

    if (!userEmail) {
        return res.status(400).json({ error: 'User email is required.' });
    }

    // Query the database to get the booking status of the logged-in user
    const sql = 'SELECT status FROM bookings WHERE email = ?';
    db.query(sql, [email], (err, result) => {
        if (err) {
            console.error('Error querying the database:', err);
            return res.status(500).json({ error: 'Error querying the database.' });
        }

        if (result.length === 0) {
            // If no booking is associated with the user, error
            return res.status(404).json({ message: 'No booking found for the logged-in user.' });
        }

        // Return the booking status of the logged-in user
        const status = result[0].status;
        return res.status(200).json({ status });
    });
});

// Protected route to get available times
app.get('/api/available-times', verifyToken, (req, res) => {

    const userEmail = req.user.email;
    const availableTimes = ['8:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
    res.json(availableTimes);
});

// GET route to retrieve the list of statuses
app.get('/api/status', (req, res) => {
    const query = 'SELECT idstatus, status FROM status';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching the list of statuses:', err);
            return res.status(500).json({ error: 'Error fetching the list of statuses.' });
        }
        res.json(results);
    });
});

//Route to update status in bookings tablew
app.post('/api/bookings/update-status', (req, res) => {
    const { statusId, bookingId } = req.body;

    // Atualiza o status da reserva na tabela "bookings"
    const query = 'UPDATE bookings SET status_id = ? WHERE idbookings = ?';
    db.query(query, [statusId, bookingId], (err, result) => {
        if (err) {
            console.error('Error updating the booking status:', err);
            return res.status(500).json({ error: 'Error updating the booking status.' });
        }

        if (result.affectedRows === 0) {
            // No booking was updated, likely because the ID doesn't exist
            return res.status(400).json({ error: 'The provided booking ID is not valid.' });
        }

        // Set headers to prevent caching
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        return res.status(200).json({ message: 'Booking status updated successfully.' });
    });
});

// GET route to retrieve the list of staff members
app.get('/api/staffs', (req, res) => {
    const query = 'SELECT idstaffs, name FROM staffs';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching the list of staff members:', err);
            return res.status(500).json({ error: 'Error fetching the list of staff members.' });
        }

        res.json(results);
    });
});

// DELETE SECTION

// Route to delete a booking by ID
app.delete('/api/bookings/:id', (req, res) => {
    const bookingId = req.params.id;

    // Check if the booking ID is valid (should be an integer)
    if (isNaN(bookingId)) {
        return res.status(400).json({ error: 'The booking ID must be a valid integer.' });
    }

    // Delete the booking from the "bookings" table
    const query = 'DELETE FROM bookings WHERE idbookings = ?';
    db.query(query, [bookingId], (err, result) => {
        if (err) {
            console.error('Error deleting the booking:', err);
            return res.status(500).json({ error: 'Error deleting the booking.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No booking found with the provided ID.' });
        }
        return res.status(200).json({ message: 'Booking deleted successfully.' });
    });
});

// Route to delete a booking by booking details ID
app.delete('/api/booking_details/:id', (req, res) => {
    const bookingId = req.params.id;

    if (isNaN(bookingId)) {
        return res.status(400).json({ error: 'The booking ID must be a valid integer.' });
    }

    // Delete the booking from the "booking_details" table
    const query = 'DELETE FROM booking_details WHERE idbookings = ?';
    db.query(query, [bookingId], (err, result) => {
        if (err) {
            console.error('Error deleting the booking:', err);
            return res.status(500).json({ error: 'Error deleting the booking.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No booking found with the provided ID.' });
        }
        return res.status(200).json({ message: 'Booking deleted successfully.' });
    });
});

// Route to delete an invoice by booking details ID
app.delete('/api/invoice-details/:id', (req, res) => {
    const bookingId = req.params.id;

    if (isNaN(bookingId)) {
        return res.status(400).json({ error: 'The booking ID must be a valid integer.' });
    }

    // Delete the booking from the "invoices" table
    const query = 'DELETE FROM invoices WHERE idbookings = ?';
    db.query(query, [bookingId], (err, result) => {
        if (err) {
            console.error('Error deleting the booking:', err);
            return res.status(500).json({ error: 'Error deleting the booking.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No booking found with the provided ID.' });
        }
        return res.status(200).json({ message: 'Booking deleted successfully.' });
    });
});

// Route for update the mechanic 
app.post('/api/bookings/update-mechanic', (req, res) => {
    const { bookingId, mechanicId } = req.body;

    // Check if the provided mechanic (staff) exists in the "staffs" table
    const staffQuery = 'SELECT idstaffs FROM staffs';
    db.query(staffQuery, [mechanicId], (err, result) => {
        if (err) {
            console.error('Error verifying mechanic (staff):', err);
            return res.status(500).json({ error: 'Error verifying mechanic (staff).' });
        }

        if (result.length === 0) {
            return res.status(400).json({ error: 'The provided mechanic (staff) is not valid.' });
        }

        // Update the mechanic for the booking in the "bookings" table
        const query = 'UPDATE bookings SET mechanic = ? WHERE idbookings = ?';
        db.query(query, [mechanicId, bookingId], (err, result) => {
            if (err) {
                console.error('Error updating mechanic for booking:', err);
                return res.status(500).json({ error: 'Error updating mechanic for booking.' });
            }
            return res.status(200).json({ message: 'Mechanic for booking updated successfully.' });
        });
    });
});

// Rota para adicionar um produto a uma reserva
app.post('/api/booking-details/add-product', (req, res) => {
    const { bookingId, productId, quantity, cost } = req.body;

    // Execute a lógica para adicionar o produto à reserva na tabela booking_details
    const query = 'INSERT INTO booking_details (idbookings, idproducts, quantity, cost) VALUES (?, ?, ?, ?)';
    db.query(query, [bookingId, productId, quantity, cost], (err, result) => {
        if (err) {
            console.error('Error adding product to booking:', err);
            return res.status(500).json({ error: 'Error adding product to booking.' });
        }

        return res.status(200).json({ message: 'Product added to booking successfully.' });
    });
});

// Route to fetch products from the "products" table
app.get('/api/products', (req, res) => {
    const sql = 'SELECT * FROM products';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching data from the products table:', err);
            return res.status(500).json({ error: 'Error fetching data from the products table.' });
        }
        res.json(result);
    });
});

//ENDPOINTS

// Route to get product details by ID
app.get('/api/products/:id', (req, res) => {
    const productId = req.params.id;

    const query = 'SELECT * FROM products WHERE idproduct = ?';
    db.query(query, [productId], (err, result) => {
        if (err) {
            console.error('Error fetching product details:', err);
            return res.status(500).json({ error: 'Error fetching product details.' });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const productDetails = result[0];
        res.json(productDetails);
    });
});

// Route to get booking details by ID
app.get('/api/bookings/:id', (req, res) => {
    const bookingId = req.params.id;

    const query = 'SELECT * FROM bookings WHERE idbookings = ?';
    db.query(query, [bookingId], (err, result) => {
        if (err) {
            console.error('Error fetching booking details:', err);
            return res.status(500).json({ error: 'Error fetching booking details.' });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const bookingDetails = result[0];
        res.json(bookingDetails);
    });
});

// Route to update service cost in a booking
app.post('/api/booking-details/update-service-cost', (req, res) => {
    const { bookingId, newServiceCost } = req.body;

    const query = 'UPDATE booking_details SET cost = ? WHERE idbookings = ?';
    db.query(query, [newServiceCost, bookingId], (err, result) => {
        if (err) {
            console.error('Error updating service cost:', err);
            return res.status(500).json({ error: 'Error updating service cost.' });
        }

        return res.status(200).json({ message: 'Service cost updated successfully.' });
    });
});

// Route to fetch service cost based on booking ID
app.get('/api/bookings/service-cost/:id', (req, res) => {
    const bookingId = parseInt(req.params.id);

    const query = 'SELECT cost FROM bookings WHERE idbookings = ?';
    db.query(query, [bookingId], (err, result) => {
        if (err) {
            console.error('Error fetching service cost:', err);
            res.status(500).json({ error: 'Error fetching service cost.' });
            return;
        }

        if (result.length > 0) {
            res.json({ cost: result[0].cost });
        } else {
            res.status(404).json({ error: 'Booking not found.' });
        }
    });
});

// Route to check if a record exists in the booking_details table with the same bookingId
app.get('/api/booking-details/exists/:bookingId', (req, res) => {
    const bookingId = req.params.bookingId;

    const query = 'SELECT COUNT(*) AS count FROM booking_details WHERE idbookings = ?';
    db.query(query, [bookingId], (err, result) => {
        if (err) {
            console.error('Error checking if booking exists:', err);
            return res.status(500).json({ error: 'Error checking if booking exists.' });
        }

        const count = result[0].count;
        return res.status(200).json({ exists: count > 0 });
    });
});

// Route to check if a record exists in the invoices table with the same bookingId
app.get('/api/invoice-details/exists/:bookingId', (req, res) => {
    const bookingId = req.params.bookingId;

    const query = 'SELECT COUNT(*) AS count FROM invoices WHERE idbookings = ?';
    db.query(query, [bookingId], (err, result) => {
        if (err) {
            console.error('Error checking if booking exists:', err);
            return res.status(500).json({ error: 'Error checking if booking exists.' });
        }

        const count = result[0].count;
        return res.status(200).json({ exists: count > 0 });
    });
});

// Route to get the status of a booking by ID
app.get('/api/bookings/:id/status', (req, res) => {
    const bookingId = req.params.id;

    const query = 'SELECT status_id FROM bookings WHERE idbookings = ?';
    db.query(query, [bookingId], (err, result) => {
        if (err) {
            console.error('Error fetching booking status:', err);
            return res.status(500).json({ error: 'Error fetching booking status.' });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const bookingStatus = result[0].status_id;
        res.json({ status_id: bookingStatus });
    });
});

// Route to add booking details to the booking_details table
app.post('/api/bookings_details/add', (req, res) => {
    const { bookingId, status } = req.body;

    // // Verifique se os dados necessários foram fornecidos
    // if (!bookingId || !status) {
    //     return res.status(400).json({ error: 'Booking ID and details are required.' });
    // }

    const query = 'INSERT INTO booking_details (idbookings, status) VALUES (?, ?)';
    db.query(query, [bookingId, status], (err, result) => {
        if (err) {
            console.error('Error adding booking detail:', err);
            return res.status(500).json({ error: 'Error adding booking detail.' });
        }
        return res.status(200).json({ message: 'Booking detail added successfully.' });
    });
});


// Route to update the status of booking details in the booking_details table
app.post('/api/bookings_details/update-status', (req, res) => {
    const { bookingId, newStatusId } = req.body;

    if (!bookingId || !newStatusId) {
        return res.status(400).json({ error: 'Booking ID and new status ID are required.' });
    }

    const query = 'UPDATE booking_details SET status = ? WHERE idbookings = ?';
    db.query(query, [newStatusId, bookingId], (err, result) => {
        if (err) {
            console.error('Error updating booking detail status:', err);
            return res.status(500).json({ error: 'Error updating booking detail status.' });
        }

        return res.status(200).json({ message: 'Booking detail status updated successfully.' });
    });
});

// Route to add a mechanic to a booking
app.post('/api/booking-details/add-mechanic', (req, res) => {
    const { idbookings, mechanic } = req.body;

    const query = 'INSERT INTO booking_details (idbookings, mechanic) VALUES (?, ?)';
    db.query(query, [idbookings, mechanic], (err, result) => {
        if (err) {
            console.error('Error adding product to booking:', err);
            return res.status(500).json({ error: 'Error adding product to booking.' });
        }

        return res.status(200).json({ message: 'Product added to booking successfully.' });
    });
});

// Route to fetch the mechanic based on the booking ID
app.get('/api/bookings/:id/mechanic', (req, res) => {
    const bookingId = parseInt(req.params.id);

    const query = 'SELECT mechanic FROM bookings WHERE idbookings = ?';
    db.query(query, [bookingId], (err, result) => {
        if (err) {
            console.error('Error fetching mechanic:', err);
            res.status(500).json({ error: 'Error fetching mechanic.' });
            return;
        }

        if (result.length > 0) {
            res.json({ mechanic: result[0].mechanic });
        } else {
            res.status(404).json({ error: 'Booking not found.' });
        }
    });
});

// Route to fetch the vehicle based on the booking ID
app.get('/api/bookings/:id/vehicle', (req, res) => {
    const bookingId = parseInt(req.params.id);

    const query = 'SELECT vehicle FROM bookings WHERE idbookings = ?';
    db.query(query, [bookingId], (err, result) => {
        if (err) {
            console.error('Error fetching vehicle:', err);
            res.status(500).json({ error: 'Error fetching vehicle.' });
            return;
        }

        if (result.length > 0) {
            res.json({ vehicle: result[0].vehicle });
        } else {
            res.status(404).json({ error: 'Booking not found.' });
        }
    });
});

// Route to add a new invoice to the invoices table
app.post('/api/invoices/add', (req, res) => {
    const { idproducts, vehicle, idbookings, name, quantity, service, date, amount } = req.body;

    const formattedTime = formatDateForSQL(date); // Formata a data aqui

    if (!idbookings) {
        return res.status(400).json({ error: 'idbookings is required.' });
    }

    const query = 'INSERT INTO invoices (idproducts, vehicle, idbookings, name, quantity, service, date, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [idproducts, vehicle, idbookings, name, quantity, service, formattedTime, amount], (err, result) => {
        if (err) {
            console.error('Error adding invoice:', err);
            return res.status(500).json({ error: 'Error adding invoice.' });
        }

        // Return the newly added invoice with the ID generated by the database
        const newInvoice = {
            id: result.insertId,
            idproducts,
            vehicle,
            idbookings,
            name,
            quantity,
            service,
            date: formattedTime,
            amount,
        };
        return res.status(201).json(newInvoice);
    });
});

// Route to fetch invoice details by booking ID
app.get('/api/invoices/byBookingId/:bookingId', (req, res) => {
    const bookingId = req.params.bookingId;

    const query = 'SELECT * FROM invoices WHERE idbookings = ?';
    db.query(query, [bookingId], (err, result) => {
        if (err) {
            console.error('Error fetching invoice details:', err);
            return res.status(500).json({ error: 'Error fetching invoice details.' });
        }
        return res.status(200).json(result);
    });
});


// Function to format date and time into the appropriate format for SQL
function formatDateForSQL(dateTime) {
    const date = new Date(dateTime);
    const formattedDate = date.toISOString().slice(0, 19).replace('T', ' ');
    return formattedDate;
}

// Start the server on port 3000
app.listen(3000, () => {
    console.log('Backend server started on port 3000.');
});