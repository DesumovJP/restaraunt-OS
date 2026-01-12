/**
 * Menu GraphQL Queries
 * Queries for menu categories, items, and recipes
 */

import { gql } from "urql";

/**
 * Get all active categories with their menu items
 */
export const GET_ALL_CATEGORIES = gql`
  query GetAllCategories {
    menuCategories(
      filters: { isActive: { eq: true } }
      sort: ["sortOrder:asc"]
    ) {
      documentId
      name
      nameUk
      slug
      icon
      sortOrder
      menuItems(
        filters: { available: { eq: true } }
        pagination: { limit: 100 }
      ) {
        documentId
        name
        nameUk
        slug
        description
        price
        weight
        portionSize
        portionUnit
        portionsPerRecipe
        preparationTime
        available
        servingCourse
        primaryStation
        allergens
        image {
          url
          alternativeText
        }
      }
    }
  }
`;

/**
 * Get all active recipes with ingredients and steps
 */
export const GET_RECIPES = gql`
  query GetRecipes {
    recipes(
      filters: { isActive: { eq: true } }
      sort: ["name:asc"]
    ) {
      documentId
      name
      nameUk
      slug
      portionYield
      costPerPortion
      prepTimeMinutes
      cookTimeMinutes
      isActive
      outputType
      ingredients {
        ingredient {
          documentId
          name
          unit
        }
        quantity
        unit
        processChain
        isOptional
        wasteAllowancePercent
      }
      steps {
        stepNumber
        description
        station
        estimatedTimeMinutes
        processType
      }
    }
  }
`;

/**
 * Get recipe for a menu item (for inventory deduction)
 */
export const GET_MENU_ITEM_RECIPE = gql`
  query GetMenuItemRecipe($menuItemId: ID!) {
    menuItem(documentId: $menuItemId) {
      documentId
      name
      recipe {
        documentId
        name
        portionYield
        ingredients {
          ingredient {
            documentId
            name
            nameUk
            unit
            yieldProfile {
              documentId
              baseYieldRatio
              processYields
            }
          }
          quantity
          unit
          processChain
          wasteAllowancePercent
        }
      }
    }
  }
`;
