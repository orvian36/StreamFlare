## StreamFlare
A simple movie streaming app made for the term project of CSE 3100 (System Project) at Khulna University of Engineering & Technology.
## Demo Video: 

## Features:
 1. Movie/TV show streaming
 2. Personalized recommendation based on your history
 3. Subscription management
 4. Flexible search options
 5. Simple & intuitive UI

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

What things you need to install the software and how to install them

1. Node.js
2. React.js
3. Oracle 21c


### Installing

A step by step series of examples that tell you how to get a development env running

1. Backend
```
 >> cd backend
 >> npm install
 >> npm start
```
2. Frontend
```
 >> cd frontend
 >> npm install
 >> npm start
```
3. Oracle 21c
 
 Type this in Oracle SQL PLUS
 ```
 >> follow this article to setup database
  https://www.oracle.com/database/technologies/appdev/quickstartnodeonprem.html
```
 After that, run the DDL, PROCEDURES, TRIGGERS, FUNCTIONS file to set up the database tables and relevant functions.
 
 Also, if possible, import the data from [Table Backup](https://github.com/webgeekhabib007/StreamFlare/tree/master/Table%20Backup)
 
 We used Navicat for connecting to Oracle, you're free to use anything else.


## Built With

* [Node.js](https://nodejs.org/en/) - Backend environment
* [Express](https://expressjs.com/) - Backend Server
* [React](https://reactjs.org/) - Frontend Library
* [Oracle 21c](https://www.oracle.com/database/technologies/oracle-database-software-downloads.html) - Database


## Authors

* **Habibur Rahman** - [webgeekhabib007](https://github.com/webgeekhabib007)
* **Naieem Islam** - [Naieem-55](https://github.com/Naieem-55)


## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Our Project Supervisor:
  Dola Das
  (Assistant Professor, 
  Dept. of CSE,
  Khulna University of Engineering & Technology) 
  
* Stack Overflow
* Developers who built Node.js & React
