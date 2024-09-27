Cryptocurrency Trade Parsing and Balance Calculator

Overview
This project is a Node.js application that parses cryptocurrency trade data from a CSV file and calculates the asset-wise balance at any given timestamp. It uses MongoDB for data storage.



1. Clone the Repository

git clone https://github.com/Kalpanaba/koinXpoc.git
cd backend
npm install


2.modify  .env file in the root directory of your project and add the following:
MONGODB_URI=mongodb://localhost:27017/tradesDB


3.Run the server 
node server.js
The server will start running on http://localhost:3000.


4. Testing the APIs
You can test the APIs using Postman or any other API client.

Upload CSV:

Set the request type to POST.
Set the URL to http://localhost:3000/upload-csv.
Select Body -> form-data and add the key file with your CSV file.

Get Balances:

Set the request type to POST.
Set the URL to http://localhost:3000/balance.
Add a JSON body with the desired timestamp.


5. Stopping the Server
To stop the server, use Ctrl + C in the terminal where the server is running.
