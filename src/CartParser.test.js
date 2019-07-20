import CartParser from './CartParser';
import * as uuid from 'uuid';
import { readFileSync } from 'fs';
import * as path from 'path';

let parser;
jest.mock('uuid');

beforeEach(() => {
	parser = new CartParser();
});

describe('CartParser - unit tests', () => {

	describe('parseLine', () => {
		it('should returns a correct data in json format', () => {
			uuid.v4.mockReturnValue('1');
			const expected = {
				"id": "1",
				"name": "Tvoluptatem",
				"price": 10.32,
				"quantity": 1
			};	
			expect(parser.parseLine('Tvoluptatem,10.32,1')).toMatchObject(expected);
		});
	
		it('should set value as NaN when have incorrect type of data', () => {	
			expect(parser.parseLine('Tvoluptatem,10.32,twenty').quantity).toBe(NaN);
		});
	});

	describe('validate', () => {
		beforeEach(() => {
			parser.createError = jest.fn();
		});

		it('should not create any error when passes a string in correct format', () => {
			parser.validate('Product name,Price,Quantity'+'\n'+'Mollis consequat,9.00,2');
	
			expect(parser.createError).not.toHaveBeenCalled();
		});
	
		it('should create one header error when passes a string with row with one incorrect header', () => {	
			parser.validate('Product title,Price,Quantity'+'\n'+'Mollis consequat,9.00,2');
	
			expect(parser.createError).toHaveBeenCalledTimes(1);
			expect(parser.createError).toHaveBeenCalledWith("header", 0, 0, "Expected header to be named \"Product name\" but received Product title.");
		});
	
		it('should create one row error when passes a string with row with less number of cells than expected', () => {	
			parser.validate('Product name,Price,Quantity'+'\n'+'Mollis consequat,9.00');
	
			expect(parser.createError).toHaveBeenCalledTimes(1);
			expect(parser.createError).toHaveBeenCalledWith("row", 1, -1, "Expected row to have 3 cells but received 2.");
		});
	
		it('should create one cell error when passes a string with row with empty product name', () => {	
			parser.validate('Product name,Price,Quantity'+'\n'+' ,9.00,2');
	
			expect(parser.createError).toHaveBeenCalledTimes(1);
			expect(parser.createError).toHaveBeenCalledWith("cell", 1, 0, "Expected cell to be a nonempty string but received \"\".");
		});
	
		it('should create one cell error when passes a string with row with negative number', () => {	
			parser.validate('Product name,Price,Quantity'+'\n'+'Mollis consequat,9.00,-2');
	
			expect(parser.createError).toHaveBeenCalledTimes(1);
			expect(parser.createError).toHaveBeenCalledWith("cell", 1, 2, "Expected cell to be a positive number but received \"-2\".");
		});
	});

	describe('parse', () => {
		it('should call readFile and validate only one time', () => {
			parser.readFile = jest.fn(() => '');
			parser.validate = jest.fn(() => []);
	
			parser.parse();
	
			expect(parser.readFile).toHaveBeenCalledTimes(1);
			expect(parser.validate).toHaveBeenCalledTimes(1);
		});
	
		it('should throw when there are errors', () => {
			parser.readFile = jest.fn();
			parser.validate = jest.fn(() => ['error1', 'error2']);
	
			expect(() => parser.parse()).toThrow('Validation failed!');
		});
	
		it('should call parseLine 2 times when there is string with 3 rows', () => {
			parser.readFile = jest.fn(() => 'Product name,Price,Quantity'+'\n'+'Mollis consequat,9.00,2'+'\n'+'Mollis consequat,9.00,2');
			parser.validate = jest.fn(() => []);
			parser.parseLine = jest.fn();
			parser.calcTotal = jest.fn(() => 1);
			
			parser.parse();
			
			expect(parser.parseLine).toHaveBeenCalledTimes(2);
		});
	
		it('should call calcTotal 1 time with correct arguments', () => {
			parser.readFile = jest.fn(() => 'a\na');
			parser.validate = jest.fn(() => []);
			parser.parseLine = jest.fn(() => ({"id": "1", "name": "Mollis consequat", "price": 9, "quantity": 2}));
			parser.calcTotal = jest.fn(() => 1);
			
			parser.parse();
			
			expect(parser.calcTotal).toHaveBeenCalledTimes(1);
			expect(parser.calcTotal).toHaveBeenCalledWith(
				[{"id": "1", "name": "Mollis consequat", "price": 9, "quantity": 2}]
			);
		});	
	});

});

describe('CartParser - integration test', () => {
	it('should parsed .csv file into .json format', () => { 
		uuid.v4 
			.mockReturnValueOnce('3e6def17-5e87-4f27-b6b8-ae78948523a9') 
			.mockReturnValueOnce('90cd22aa-8bcf-4510-a18d-ec14656d1f6a') 
			.mockReturnValueOnce('33c14844-8cae-4acd-91ed-6209a6c0bc31') 
			.mockReturnValueOnce('f089a251-a563-46ef-b27b-5c9f6dd0afd3') 
			.mockReturnValue('0d1cbe5e-3de6-4f6a-9c53-bab32c168fbf'); 

		const csvPath = path.resolve(__dirname, "../samples/cart.csv"); 
		const jsonPath = path.resolve(__dirname, "../samples/cart.json"); 
	   
		const recieved = parser.parse(csvPath); 
		const expected = JSON.parse(readFileSync(jsonPath, 'utf8'));
	   
		expect(recieved).toMatchObject(expected); 
	}); 
});