# Database Migration Guide - AC & Multi-Bed Booking Features

## Overview
This migration adds support for:
1. AC charge configuration per room
2. Multi-bed pricing discounts
3. Multiple beds per booking
4. AC option selection during booking

## Schema Changes

### Room Model
- Added `acCharge` (Decimal, default: 0) - Extra charge per bed when AC is selected
- Added `multiBedPricing` (JSON, optional) - Discount configuration for multi-bed bookings

### Booking Model
- Changed `bedId` to nullable (for backward compatibility)
- Added `acSelected` (Boolean, default: false) - User's AC selection
- Added `bookingBeds` relation - Links to multiple beds

### New BookingBed Model
- Junction table linking bookings to multiple beds

## Migration Steps

1. **Generate Migration**
   ```bash
   npx prisma migrate dev --name add_ac_and_multibed_booking
   ```

2. **Verify Data Preservation**
   - All existing rooms will have `acCharge = 0` (default)
   - All existing bookings will have `bedId` preserved (nullable allows backward compatibility)
   - All existing bookings will have `acSelected = false` (default)
   - Existing single-bed bookings will continue to work

3. **Update Existing Rooms (Optional)**
   If you want to set AC charges for existing rooms:
   ```sql
   UPDATE rooms SET ac_charge = 500 WHERE has_ac = true;
   ```

4. **Update Existing Bookings (Optional)**
   If you have existing bookings without `bedId`, they will need to be migrated:
   ```sql
   -- This should not be necessary as bedId is only nullable for new multi-bed bookings
   ```

## Backward Compatibility

- ✅ Existing single-bed bookings continue to work
- ✅ `bedId` is nullable but existing bookings retain their `bedId`
- ✅ All new fields have defaults
- ✅ No data loss expected

## Testing Checklist

- [ ] Create a room with AC and set AC charge
- [ ] Create a room with multi-bed pricing
- [ ] Book a single bed without AC
- [ ] Book a single bed with AC
- [ ] Book multiple beds in the same room
- [ ] Verify multi-bed discount is applied
- [ ] Verify AC charge is added when AC is selected
- [ ] Approve a multi-bed booking
- [ ] Convert a multi-bed booking to tenant

