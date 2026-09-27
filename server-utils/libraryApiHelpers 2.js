// src/utils/libraryApiHelpers.ts
var constructImageUrl = (volumeInfo) => {
  if (!(volumeInfo == null ? void 0 : volumeInfo.imageLinks))
    return void 0;
  const imageLinks = volumeInfo.imageLinks;
  if (imageLinks.extraLarge)
    return imageLinks.extraLarge;
  if (imageLinks.large)
    return imageLinks.large;
  if (imageLinks.medium)
    return imageLinks.medium;
  if (imageLinks.small)
    return imageLinks.small;
  if (imageLinks.thumbnail)
    return imageLinks.thumbnail;
  if (imageLinks.smallThumbnail)
    return imageLinks.smallThumbnail;
  return void 0;
};
var cleanGoogleBooksData = (item) => {
  var _a, _b, _c, _d;
  const volumeInfo = item.volumeInfo || {};
  return {
    id: item.id || "",
    title: volumeInfo.title || "Unknown Title",
    author: ((_a = volumeInfo.authors) == null ? void 0 : _a.join(", ")) || "Unknown Author",
    description: volumeInfo.description || "",
    imageUrl: constructImageUrl(volumeInfo),
    source: "google_books",
    isbn: ((_c = (_b = volumeInfo.industryIdentifiers) == null ? void 0 : _b[0]) == null ? void 0 : _c.identifier) || "",
    publishedDate: volumeInfo.publishedDate || "",
    pageCount: volumeInfo.pageCount || 0,
    language: volumeInfo.language || "en",
    genre: ((_d = volumeInfo.categories) == null ? void 0 : _d[0]) || "General"
  };
};
var cleanInternetArchiveData = (item) => {
  var _a, _b, _c;
  return {
    id: item.identifier || "",
    title: item.title || "Unknown Title",
    author: ((_a = item.creator) == null ? void 0 : _a.join(", ")) || "Unknown Author",
    description: item.description || "",
    imageUrl: item.identifier ? `https://archive.org/services/img/${item.identifier}` : void 0,
    source: "internet_archive",
    publishedDate: item.date || "",
    pageCount: 0,
    language: ((_b = item.language) == null ? void 0 : _b[0]) || "en",
    genre: ((_c = item.subject) == null ? void 0 : _c[0]) || "General"
  };
};
var prepareBookForLibrary = (bookData) => {
  return {
    title: bookData.title,
    author: bookData.author,
    description: bookData.description,
    cover_image_url: bookData.imageUrl,
    isbn: bookData.isbn,
    publication_year: bookData.publishedDate ? parseInt(bookData.publishedDate.split("-")[0]) : void 0,
    pages: bookData.pageCount,
    language: bookData.language,
    genre: bookData.genre,
    source: bookData.source
  };
};
export {
  cleanGoogleBooksData,
  cleanInternetArchiveData,
  constructImageUrl,
  prepareBookForLibrary
};
