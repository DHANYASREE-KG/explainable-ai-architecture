import { BasicRequirementsConfig, RoomRequirement } from '../types';
import { calculateRoomArea } from './areaCalculator';

export function expandRequirementsToSpaces(
  config: BasicRequirementsConfig,
  currentRooms: RoomRequirement[] = []
): RoomRequirement[] {
  const result: RoomRequirement[] = [];

  const existingMap = new Map<string, RoomRequirement>();
  currentRooms.forEach((r) => existingMap.set(r.id, r));

  const addOrPreserve = (
    id: string,
    name: string,
    category: 'main' | 'sanitary' | 'outdoor' | 'utility' | 'optional',
    defaultL: number,
    defaultB: number,
    isRequired: boolean = false,
    minArea: number = 20
  ) => {
    const existing = existingMap.get(id);
    if (existing) {
      result.push(existing);
    } else {
      result.push({
        id,
        name,
        category,
        count: 1,
        length: defaultL,
        breadth: defaultB,
        area: calculateRoomArea(defaultL, defaultB),
        isRequired,
        minRecommendedArea: minArea,
      });
    }
  };

  // Halls / Living Rooms
  for (let i = 1; i <= config.halls; i++) {
    addOrPreserve(
      `living-${i}`,
      config.halls === 1 ? 'Living Room (Hall)' : `Living Room ${i}`,
      'main',
      16,
      14,
      true,
      120
    );
  }

  // Dining Rooms
  for (let i = 1; i <= config.diningRooms; i++) {
    addOrPreserve(
      `dining-${i}`,
      config.diningRooms === 1 ? 'Dining Room' : `Dining Room ${i}`,
      'main',
      12,
      10,
      false,
      80
    );
  }

  // Kitchens
  for (let i = 1; i <= config.kitchens; i++) {
    addOrPreserve(
      `kitchen-${i}`,
      config.kitchens === 1 ? 'Kitchen' : `Kitchen ${i}`,
      'main',
      10,
      8,
      true,
      60
    );
  }

  // Bedrooms
  for (let i = 1; i <= config.bedrooms; i++) {
    const isMaster = i === 1;
    addOrPreserve(
      `bedroom-${i}`,
      isMaster ? 'Master Bedroom' : `Bedroom ${i}`,
      'main',
      isMaster ? 14 : 12,
      isMaster ? 12 : 11,
      true,
      100
    );
  }

  // Attached Bathrooms
  for (let i = 1; i <= config.attachedBathrooms; i++) {
    addOrPreserve(
      `att-bath-${i}`,
      config.attachedBathrooms === 1 ? 'Attached Bathroom' : `Attached Bath ${i}`,
      'sanitary',
      7,
      5,
      false,
      25
    );
  }

  // Common Bathrooms
  for (let i = 1; i <= config.bathrooms; i++) {
    addOrPreserve(
      `bath-${i}`,
      config.bathrooms === 1 ? 'Common Bathroom' : `Common Bath ${i}`,
      'sanitary',
      7,
      5,
      true,
      25
    );
  }

  // Staircase
  if (config.hasStaircase) {
    addOrPreserve('staircase', 'Staircase Core', 'utility', 10, 6, false, 40);
  }

  // Parking
  if (config.hasParking) {
    addOrPreserve('parking', 'Car Parking Bay', 'outdoor', 16, 10, false, 120);
  }

  // Balcony
  if (config.hasBalcony) {
    addOrPreserve('balcony', 'Balcony / Sit-Out', 'outdoor', 10, 4.5, false, 35);
  }

  // Garden
  if (config.hasGarden) {
    addOrPreserve('garden', 'Garden / Landscaping', 'outdoor', 12, 8, false, 60);
  }

  // Optional Rooms
  if (config.optionalRooms.prayerRoom) {
    addOrPreserve('prayer', 'Prayer / Pooja Room', 'optional', 6, 5, false, 25);
  }
  if (config.optionalRooms.studyRoom) {
    addOrPreserve('study', 'Study Room', 'optional', 10, 8, false, 60);
  }
  if (config.optionalRooms.homeOffice) {
    addOrPreserve('office', 'Home Office', 'optional', 10, 10, false, 70);
  }
  if (config.optionalRooms.guestRoom) {
    addOrPreserve('guest', 'Guest Bedroom', 'optional', 12, 10, false, 90);
  }
  if (config.optionalRooms.storeRoom) {
    addOrPreserve('store', 'Store Room', 'optional', 6, 5, false, 25);
  }
  if (config.optionalRooms.utilityRoom) {
    addOrPreserve('utility', 'Utility Area', 'utility', 7, 5, false, 25);
  }
  if (config.optionalRooms.laundryRoom) {
    addOrPreserve('laundry', 'Laundry Room', 'utility', 6, 5, false, 25);
  }

  return result;
}
