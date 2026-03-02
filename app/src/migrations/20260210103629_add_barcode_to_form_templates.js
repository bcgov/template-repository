/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const exists = await knex.schema.hasTable("form_templates");
  if (exists) {
    return knex.schema.alterTable("form_templates", (table) => {
      table.jsonb("barcode");
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable("form_templates", (table) => {
    table.dropColumn("barcode");
  });
};
