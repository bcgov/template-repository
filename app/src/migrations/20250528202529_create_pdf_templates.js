/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.all([
    knex.schema.createTable("pdf_templates", (table) => {
      table.uuid("id").primary();
      table.string("name").notNullable();
      table.string("version").notNullable();
      table.string("template_uuid").notNullable();
      table.text("notes").nullable();
    }),

    knex.schema.table("form_templates", (table) => {
      table
        .uuid("pdf_template_id")
        .references("id")
        .inTable("pdf_templates")
        .nullable();
    }),
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.all([
    knex.schema.table("form_templates", (table) => {
      table.dropColumn("pdf_template_id");
    }),

    knex.schema.dropTableIfExists("pdf_templates"),
  ]);
};
