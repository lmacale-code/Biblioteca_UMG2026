export class Book {
  constructor({ id = null, title, author, isbn = null, available = true }) {
    this.id = id;
    this.title = title;
    this.author = author;
    this.isbn = isbn;
    this.available = available;
  }
}
