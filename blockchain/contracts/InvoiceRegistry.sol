// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title InvoiceRegistry
 * @notice Minimal ledger that records invoices on-chain and settles them via ERC-20 transfers.
 *         Issuers register invoices with a hashed reference and optional expected payer. The
 *         first authorised payer to call {settleInvoice} triggers the ERC-20 transfer to the
 *         issuer and marks the invoice as paid.
 */
contract InvoiceRegistry {
    using SafeERC20 for IERC20;

    struct Invoice {
        address issuer;
        address token;
        address payer;
        uint256 amount;
        bool paid;
        bytes32 referenceHash;
    }

    error InvalidToken();
    error InvalidAmount();
    error InvalidInvoice();
    error InvoiceAlreadySettled();
    error PayerNotAuthorised();

    Invoice[] private _invoices;

    event InvoiceIssued(
        uint256 indexed invoiceId,
        address indexed issuer,
        address indexed payer,
        address token,
        uint256 amount,
        bytes32 referenceHash
    );

    event InvoiceSettled(
        uint256 indexed invoiceId,
        address indexed payer,
        address token,
        uint256 amount,
        bytes32 referenceHash
    );

    function issueInvoice(
        address payer,
        address token,
        uint256 amount,
        bytes32 referenceHash
    ) external returns (uint256 invoiceId) {
        if (token == address(0)) revert InvalidToken();
        if (amount == 0) revert InvalidAmount();

        _invoices.push(
            Invoice({
                issuer: msg.sender,
                token: token,
                payer: payer,
                amount: amount,
                paid: false,
                referenceHash: referenceHash
            })
        );

        invoiceId = _invoices.length - 1;
        emit InvoiceIssued(invoiceId, msg.sender, payer, token, amount, referenceHash);
    }

    function settleInvoice(uint256 invoiceId) external {
        if (invoiceId >= _invoices.length) revert InvalidInvoice();

        Invoice storage invoice = _invoices[invoiceId];
        if (invoice.paid) revert InvoiceAlreadySettled();

        address payer = invoice.payer;
        if (payer != address(0) && payer != msg.sender) {
            revert PayerNotAuthorised();
        }

        invoice.paid = true;
        invoice.payer = payer == address(0) ? msg.sender : payer;

        IERC20(invoice.token).safeTransferFrom(msg.sender, invoice.issuer, invoice.amount);

        emit InvoiceSettled(invoiceId, msg.sender, invoice.token, invoice.amount, invoice.referenceHash);
    }

    function getInvoice(uint256 invoiceId) external view returns (Invoice memory) {
        if (invoiceId >= _invoices.length) revert InvalidInvoice();
        return _invoices[invoiceId];
    }

    function totalInvoices() external view returns (uint256) {
        return _invoices.length;
    }
}
