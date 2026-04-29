export const DISTRICTS = [
  "Nukus shahri",
  "Amudaryo",
  "Beruniy",
  "Bo'zatov",
  "Chimboy",
  "Ellikqala",
  "Qanliko'l",
  "Qorao'zak",
  "Kegeyli",
  "Xo'jayli",
  "Qo'ng'irot",
  "Mo'ynoq",
  "Nukus tumani",
  "Shumanay",
  "Taxiatosh",
  "Taxtako'pir",
  "To'rtko'l"
];

export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'passenger' | 'driver';
  car_model?: string;
  car_number?: string;
}

export interface Ride {
  id: string;
  driver_id: string;
  driver_name: string;
  driver_phone: string;
  car_model: string;
  car_number: string;
  from_loc: string;
  to_loc: string;
  price: number;
  seats: number;
  departure_time: string;
  departure_date?: string;
  has_delivery?: boolean;
  note?: string;
  created_at: string;
}

export interface RideRequest {
  id: string;
  passenger_id: string;
  passenger_name: string;
  passenger_phone: string;
  from_loc: string;
  to_loc: string;
  seats: number;
  departure_time: string;
  departure_date?: string;
  has_delivery?: boolean;
  note?: string;
  created_at: string;
}
