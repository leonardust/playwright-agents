Feature: Shopping Cart
  As a user
  I want to add products to my cart
  So that I can purchase them later

  @smoke @critical
  Scenario: Add product to cart
    Given I am logged in as "standard_user"
    When  I click on "Add to cart" button for the first product
    Then  I should see the cart counter increase
    And   the product should appear in the cart

  @smoke @dropdown
  Scenario: Sort products using dropdown
    Given I am logged in as "standard_user"
    When  I select "Price (low to high)" from "sort" dropdown
    Then  the first product price should be "$7.99"
