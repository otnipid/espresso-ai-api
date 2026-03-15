# Entity Design Guidelines

## What is an Entity?

An **Entity** is a TypeScript class that maps to a database table. It represents a domain model object that can be persisted to and retrieved from the database. Entities are the core building blocks of our data access layer using TypeORM.

## Entity Characteristics

### **Core Properties**

- **Database Mapping**: Each entity class maps to a specific database table
- **Type Safety**: Provides compile-time type checking for database operations
- **Relationships**: Defines how entities relate to each other (one-to-one, one-to-many, many-to-many)
- **Validation**: Built-in validation through TypeScript types and decorators
- **Serialization**: Automatic conversion between database records and TypeScript objects

### **TypeORM Decorators**

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';

@Entity('table_name') // Maps to database table
export class ExampleEntity {
  @PrimaryGeneratedColumn('uuid') // Auto-generated primary key
  id!: string;

  @Column({ type: 'varchar' }) // Database column mapping
  name!: string;

  @ManyToOne(() => RelatedEntity) // Relationship definition
  related!: RelatedEntity;
}
```

## 🗂️ **Schema Mapping Requirement**

### **Critical Rule: Entity-Schema Correspondence**

**Every entity in this folder MUST have a corresponding schema file in:**

```
../../espresso-db/schema
```

#### **Mapping Requirements:**

| Entity File | Schema File    | Example             |
| ----------- | -------------- | ------------------- |
| `User.ts`   | `01-users.sql` | ✅ Maps users table |
| `Bean.ts`   | `02-beans.sql` | ✅ Maps beans table |
| `Shot.ts`   | `07-shots.sql` | ✅ Maps shots table |

#### **Naming Convention:**

- **Entity**: `PascalCase.ts` (e.g., `UserProfile.ts`)
- **Schema**: `XX-descriptive-name.sql` (e.g., `12-user-profiles.sql`)
- **Table**: `snake_case` (e.g., `user_profiles`)

#### **Consistency Requirements:**

1. **Column Names Must Match**:

   ```typescript
   // Entity (TypeScript)
   @Column({ name: 'first_name' })
   firstName!: string;

   // Schema (SQL)
   CREATE TABLE users (
       first_name VARCHAR(100) NOT NULL
   );
   ```

2. **Data Types Must Align**:

   ```typescript
   // Entity
   @Column({ type: 'timestamp' })
   createdAt!: Date;

   // Schema
   created_at TIMESTAMP DEFAULT NOW()
   ```

3. **Relationships Must Be Defined in Both**:

   ```typescript
   // Entity
   @ManyToOne(() => User, user => user.shots)
   user!: User;

   // Schema
   user_id UUID REFERENCES users(id)
   ```

## 🏗️ **Entity Structure Standards**

### **Required Elements**

1. **Entity Declaration**:

   ```typescript
   @Entity('table_name')
   export class EntityName {
   ```

2. **Primary Key**:

   ```typescript
   @PrimaryGeneratedColumn('uuid')
   id!: string;
   ```

3. **Audit Fields** (Recommended):

   ```typescript
   @CreateDateColumn()
   created_at!: Date;

   @UpdateDateColumn()
   updated_at!: Date;
   ```

4. **Relationships**:
   ```typescript
   @OneToMany(() => Child, child => child.parent)
   children!: Child[];
   ```

### **Import Organization**

```typescript
// 1. TypeORM imports first
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

// 2. Related entities next
import { User } from './User';
import { Bean } from './Bean';

// 3. Type definitions
type StatusType = 'active' | 'inactive';
```

## 🔍 **Entity Validation Rules**

### **Type Safety Requirements**

- ✅ **All properties must have explicit types**
- ✅ **Use definite assignment assertion (!:) for required fields**
- ✅ **Make nullable fields explicit with `| null`**
- ✅ **Define relationships with proper typing**

### **Naming Conventions**

- ✅ **Class names**: `PascalCase`
- ✅ **Property names**: `camelCase`
- ✅ **Table names**: `snake_case`
- ✅ **Column names**: `snake_case`

### **Relationship Best Practices**

```typescript
// ✅ CORRECT - Proper relationship definition
@ManyToOne(() => User, user => user.shots)
@JoinColumn({ name: 'user_id' })
user!: User;

// ❌ WRONG - Missing join column or inverse relationship
@ManyToOne(() => User)
user!: User;
```

## 📋 **Entity Development Checklist**

### **Before Creating an Entity:**

- [ ] **Verify schema exists** in `../../espresso-db/schema/`
- [ ] **Review table structure** and column definitions
- [ ] **Identify relationships** with existing entities
- [ ] **Plan naming conventions** for consistency

### **When Creating an Entity:**

- [ ] **Use proper TypeORM decorators**
- [ ] **Match column names exactly** with schema
- [ ] **Define all relationships** bidirectionally
- [ ] **Add audit fields** (created_at, updated_at)
- [ ] **Use TypeScript strict typing**

### **After Creating an Entity:**

- [ ] **Add to entities/index.ts** export list
- [ ] **Update data-source.ts** if needed
- [ ] **Create unit tests** for entity operations
- [ ] **Verify database synchronization**

## 🚨 **Common Entity Pitfalls**

### **❌ Frequent Mistakes:**

1. **Schema Mismatch**:

   ```typescript
   // Entity says 'email'
   @Column({ name: 'email' })
   email!: string;

   // Schema says 'user_email'
   user_email VARCHAR(255)  // ❌ MISMATCH!
   ```

2. **Missing Relationships**:

   ```typescript
   // Only one side defined
   @ManyToOne(() => User)  // ❌ INCOMPLETE
   user!: User;
   ```

3. **Wrong Data Types**:
   ```typescript
   @Column({ type: 'varchar' })  // ❌ Should be timestamp
   createdAt!: Date;
   ```

### **✅ Solutions:**

1. **Always reference the schema file** while coding entities
2. **Use database migration tools** to keep schema and entities in sync
3. **Test entity operations** before committing changes

## 🔄 **Entity-Schema Synchronization**

### **Verification Commands:**

```bash
# Check TypeORM synchronization
npm run typeorm schema:sync

# Generate migration from entities
npm run typeorm migration:generate

# Run pending migrations
npm run typeorm migration:run
```

### **Development Workflow:**

1. **Create/Update Schema** → `../../espresso-db/schema/XX-table.sql`
2. **Create/Update Entity** → `src/entities/EntityName.ts`
3. **Test Synchronization** → `npm run typeorm schema:sync`
4. **Generate Migration** → `npm run typeorm migration:generate`
5. **Run Tests** → `npm run test:unit`

## 📚 **Entity Examples**

### **Simple Entity**:

```typescript
@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
```

### **Complex Entity with Relationships**:

```typescript
@Entity('shots')
export class Shot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, user => user.shots)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Bean, bean => bean.shots)
  @JoinColumn({ name: 'bean_id' })
  bean!: Bean;

  @Column({ type: 'varchar' })
  shot_type!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
```

---

## 🎯 **Key Takeaway**

**Entities are the TypeScript representation of your database schema.** Every entity must have a corresponding SQL schema file, and they must stay in perfect sync. This ensures type safety, data integrity, and maintainable code across the entire application.
