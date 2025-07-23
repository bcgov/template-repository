/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 exports.up = function (knex) {
    return knex.schema.alterTable("form_templates", (table) => {
      table
        .jsonb("interface")
        .defaultTo(knex.raw("'[]'::jsonb"));
    });
  };

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 exports.down = function (knex) {
    return knex.schema.alterTable("form_templates", (table) => {
      table.dropColumn("interface");
    });
  };