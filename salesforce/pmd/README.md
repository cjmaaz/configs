# PMD Rulesets for Apex

> Static code analysis rulesets for Salesforce Apex development based on PMD 7.18.0

[← Back to Salesforce Tools](../../docs/SALESFORCE_TOOLS.md#pmd-rulesets-for-apex)

## Quick Reference

### Available Rulesets

| File                   | Purpose          | Rules | Best For                             |
| ---------------------- | ---------------- | ----- | ------------------------------------ |
| `main-ruleset.xml`     | Balanced ruleset | 23    | Production codebases, CI/CD          |
| `standard-ruleset.xml` | Strict ruleset   | 28    | New projects, high quality standards |

### Key Differences

| Feature                    | main-ruleset.xml | standard-ruleset.xml |
| -------------------------- | ---------------- | -------------------- |
| **Global Modifier Check**  | ❌               | ✅                   |
| **Naming Conventions**     | ❌               | ✅                   |
| **ApexDoc Required**       | ❌               | ✅                   |
| **Boolean Parameters**     | ❌               | ✅ Discouraged       |
| **Documentation Category** | ❌               | ✅                   |

---

## Rule Categories

### Both Rulesets Include:

✅ **Best Practices** (4-5 rules)

- Test assertions with messages
- Test classes must have asserts
- Queueable finalizer checks
- Debug logging level enforcement

✅ **Code Style** (3-5 rules)

- Braces for if/else/for/while statements

✅ **Design** (4-5 rules)

- Complexity metrics (Cyclomatic, Cognitive, NCSS)
- Nested if statement depth limits

✅ **Error Prone** (5 rules)

- No hardcoded IDs
- No empty catch/if blocks
- CSRF protection
- Proper trigger map usage

✅ **Performance** (3 rules)

- Avoid debug statements in production
- No high-cost operations in loops
- No governor limit operations in loops

✅ **Security** (4 rules)

- Bad crypto detection
- CRUD/FLS violation checks
- Sharing rule violations
- SOQL injection prevention

### Standard Ruleset Adds:

✅ **Documentation**

- ApexDoc comments required for public classes/methods

---

## Quick Start

### 1. With Salesforce Code Analyzer (IDE)

```json
{
  "salesforce-code-analyzer.pmd.enabled": true,
  "salesforce-code-analyzer.pmd.rulesets": ["/absolute/path/to/salesforce/pmd/main-ruleset.xml"]
}
```

### 2. Command Line

```bash
# Install PMD
brew install pmd  # macOS

# Run analysis
pmd check --dir force-app/main/default/classes \
  --rulesets salesforce/pmd/main-ruleset.xml \
  --format text
```

### 3. Salesforce CLI Scanner

```bash
# Install plugin
sf plugins install @salesforce/sfdx-scanner

# Run scan
sf scanner run --target "force-app/**/*.cls" \
  --pmdconfig salesforce/pmd/main-ruleset.xml \
  --format table
```

---

## Choosing Your Ruleset

### Use `main-ruleset.xml` if:

- ✅ Working with existing production code
- ✅ Need balanced quality checks without overwhelming violations
- ✅ Running in CI/CD pipeline
- ✅ Quick code review needed

### Use `standard-ruleset.xml` if:

- ✅ Starting a new greenfield project
- ✅ Enforcing strict coding standards
- ✅ Requiring comprehensive documentation
- ✅ Building enterprise-grade applications

---

## Common Violations & Quick Fixes

### ApexCRUDViolation

```apex
// ❌ Before
insert newAccount;

// ✅ After
if (Schema.sObjectType.Account.isCreateable()) {
    insert newAccount;
}
```

### OperationWithLimitsInLoop

```apex
// ❌ Before
for (Account acc : accounts) {
    List<Contact> contacts = [SELECT Id FROM Contact WHERE AccountId = :acc.Id];
}

// ✅ After
Set<Id> accountIds = new Set<Id>();
for (Account acc : accounts) {
    accountIds.add(acc.Id);
}
List<Contact> contacts = [SELECT Id, AccountId FROM Contact WHERE AccountId IN :accountIds];
```

### AvoidHardcodingId

```apex
// ❌ Before
Id accountId = '001000000000000AAA';

// ✅ After
Account acc = [SELECT Id FROM Account WHERE Name = 'Test Account' LIMIT 1];
Id accountId = acc.Id;
```

---

## Customization

### Adjust Rule Severity

```xml
<rule ref="category/apex/design.xml/CyclomaticComplexity">
  <properties>
    <property name="reportLevel" value="15" />
  </properties>
</rule>
```

### Suppress in Code

```apex
@SuppressWarnings('PMD.AvoidGlobalModifier')
global class MyGlobalClass {
    // ...
}
```

---

## Requirements

- **PMD**: 7.0.0+
- **Java**: 11+
- **Salesforce Code Analyzer** (optional): 4.0.0+
- **Salesforce CLI Scanner** (optional): 3.0.0+

---

## Resources

- [Complete PMD Documentation](../../docs/SALESFORCE_TOOLS.md#pmd-rulesets-for-apex)
- [PMD Apex Rules Reference](https://pmd.github.io/latest/pmd_rules_apex.html)
- [Salesforce Code Analyzer](https://marketplace.visualstudio.com/items?itemName=salesforce.sfdx-code-analyzer-vscode)

---

**Last Updated**: December 2025
**PMD Version**: 7.18.0
**Maintained by**: [Maaz Rahman](https://github.com/cjmaaz)
