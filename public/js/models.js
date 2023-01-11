/**
 * @template T
 * @typedef {Object} IPagination
 * @property {number} count
 * @property {string | null} next
 * @property {string | null} previous_button
 * @property {T[]} results
 *
 * @typedef {Object} ITitleShortData
 * @property {number} id
 * @property {string} url
 * @property {string} imdb_url
 * @property {string} title
 * @property {number} year
 * @property {string} imdb_score
 * @property {number} votes
 * @property {string} image_url
 * @property {string[]} directors
 * @property {string[]} actors
 * @property {string[]} writers
 * @property {string[]} genres
 *
 * @typedef {Object} IGenreData
 * @property {number} idx
 * @property {string} name
 *
 * @typedef {Object} ITitleFullData
 * @property {number} id
 * @property {string} url
 * @property {string} title
 * @property {string} original_title
 * @property {number} year
 * @property {string} date_published
 * @property {number} duration
 * @property {string} description
 * @property {string} long_description
 * @property {string} avg_vote
 * @property {string} imdb_score
 * @property {number} votes
 * @property {number | null} metascore
 * @property {number | null} budget
 * @property {string | null} budget_currency
 * @property {number | null} usa_gross_income
 * @property {number | null} worldwide_gross_income
 * @property {number | null} reviews_from_users
 * @property {number | null} reviews_from_critics
 * @property {string | null} image_url
 * @property {string[]} actors
 * @property {string[]} directors
 * @property {string[]} writers
 * @property {string[]} genres
 * @property {string[]} countries
 * @property {string[]} languages
 * @property {string} rated
 * @property {string} company
 */
export {};
