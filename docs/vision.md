# Project Vision - Espresso ML

## Overview
This repository contains the API definition for the Espresso ML project. It is a collection of API routes, entity definitions, and controller logic.

This repo focuses on the API and does not contain any frontend code.

Target Users: Professional and at-home baristas.

Core Value: Meticulous data collection, analysis, and creating the perfect espresso shot according to the users' preferences.

## Project Architecture
The project is composed of the following components:
- Frontend application (located in the `../frontend` directory): Built with Next.js and TypeScript
- Backend application (located in the `../backend` directory): Built with Node.js and TypeScript
- Database (located in the `../infrastructure` directory): Built with PostgreSQL

# Goals
- Maintain consistentcy between the entities and the database schema defined in `../infrastructure/charts/postgresql/schema/schema.sql`
- Provide routes to perform CRUD operations on the entities
- Ensure the API is RESTful and follows best practices