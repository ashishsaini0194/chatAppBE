// const {
//   uniqueNamesGenerator,
//   adjectives,
//   colors,
//   animals,
// } = require("unique-names-generator");
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";

export const randomName = () => {
  return uniqueNamesGenerator({
    dictionaries: [colors, animals],
    style: "upperCase",
    separator:" "
  });
};
