import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const { width } = Dimensions.get("window");
const SWIPE_X = 120;
const SWIPE_Y = 100;

type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  price: number;
  tags: string[];
  popularity: number;
  hidden: boolean;
  lat: number;
  lng: number;
};

const DATA: Restaurant[] = [
  { id: "1", name: "Spice Route", cuisine: "Indian", price: 200, tags: ["spicy","veg"], popularity: 50, hidden: false, lat: 12.9716, lng: 77.5946 },
  { id: "2", name: "Sweet Tooth", cuisine: "Desserts", price: 150, tags: ["dessert"], popularity: 40, hidden: false, lat: 12.975, lng: 77.59 },
  { id: "3", name: "Fire Bowl", cuisine: "Asian", price: 320, tags: ["spicy"], popularity: 65, hidden: false, lat: 12.969, lng: 77.6 },
  { id: "4", name: "Burger Barn", cuisine: "Fast Food", price: 180, tags: ["budget"], popularity: 55, hidden: false, lat: 12.968, lng: 77.592 },
  { id: "5", name: "Green Leaf", cuisine: "Healthy", price: 220, tags: ["veg"], popularity: 45, hidden: false, lat: 12.974, lng: 77.598 },
  { id: "6", name: "Pizza Hub", cuisine: "Italian", price: 350, tags: ["cheese"], popularity: 70, hidden: false, lat: 12.972, lng: 77.602 },
  { id: "7", name: "Chaat Junction", cuisine: "Street Food", price: 120, tags: ["spicy"], popularity: 60, hidden: false, lat: 12.976, lng: 77.596 },
  { id: "8", name: "Noodle House", cuisine: "Chinese", price: 250, tags: ["noodles"], popularity: 58, hidden: false, lat: 12.967, lng: 77.599 },
  { id: "9", name: "Cafe Mocha", cuisine: "Cafe", price: 300, tags: ["coffee"], popularity: 52, hidden: false, lat: 12.973, lng: 77.591 },
  { id: "10", name: "Ice Cream Lab", cuisine: "Desserts", price: 170, tags: ["dessert"], popularity: 48, hidden: false, lat: 12.977, lng: 77.593 },
];

export default function App() {
  const insets = useSafeAreaInsets();

  const [deck, setDeck] = useState(DATA);
  const [energy, setEnergy] = useState(15);
  const [liked, setLiked] = useState<Restaurant[]>([]);
  const [wishlist, setWishlist] = useState<Restaurant[]>([]);
  const [rejected, setRejected] = useState<Restaurant[]>([]);
  const [skipped, setSkipped] = useState<Restaurant[]>([]);

  const pos = useRef(new Animated.ValueXY()).current;
  const current = deck[0];

  const rotate = pos.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ["-10deg", "0deg", "10deg"],
  });

  const reset = () => {
    Animated.spring(pos, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
    }).start();
  };

  const swipeOut = (to: { x: number; y: number }) => {
    Animated.timing(pos, {
      toValue: to,
      duration: 220,
      useNativeDriver: true,
    }).start(next);
  };

  const next = () => {
    setDeck(d => d.slice(1));
    pos.setValue({ x: 0, y: 0 });
    setEnergy(e => Math.max(0, e - 1));
  };

  const onRelease = (dx: number, dy: number) => {
    if (!current || energy <= 0) return reset();

    if (dx > SWIPE_X) {
      setLiked(l => [...l, current]);
      swipeOut({ x: width, y: 0 });
    } else if (dx < -SWIPE_X) {
      setRejected(r => [...r, current]);
      swipeOut({ x: -width, y: 0 });
    } else if (dy < -SWIPE_Y) {
      setWishlist(w => [...w, current]);
      swipeOut({ x: 0, y: -400 });
    } else if (dy > SWIPE_Y) {
      setSkipped(s => [...s, current]);
      swipeOut({ x: 0, y: 400 });
    } else {
      reset();
    }
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => pos.setValue({ x: g.dx, y: g.dy }),
    onPanResponderRelease: (_, g) => onRelease(g.dx, g.dy),
  });

  const MAP_HTML = useMemo(
    () => `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
html,body,#map{margin:0;padding:0;height:100%}
.label{background:rgba(0,0,0,.75);color:#fff;border-radius:6px;padding:2px 6px;font-size:11px}
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const currentId=${JSON.stringify(current?.id || null)};
const data=${JSON.stringify(DATA)};
const map=L.map('map').setView([12.9716,77.5946],13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
data.forEach(r=>{
  const active=r.id===currentId;
  L.circleMarker([r.lat,r.lng],{
    radius:active?9:6,
    color:active?"#ff0000":"#1e6bff",
    fillColor:active?"#ff0000":"#1e6bff",
    fillOpacity:.95
  }).addTo(map).bindTooltip(r.name,{permanent:true,direction:"top",className:"label"});
});
</script>
</body>
</html>
`,
    [current]
  );

  const renderItem = (r: Restaurant) => (
    <Text key={r.id} style={styles.list}>
      {r.name} • {r.cuisine} • ₹{r.price} • {r.tags.join(", ")}
    </Text>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#0f0f0f" }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <Text style={styles.header}>🍔 SnackSwipe Pro</Text>
        <Text style={styles.sub}>⚡ {energy}</Text>

        {current ? (
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.card,
              { transform: [...pos.getTranslateTransform(), { rotate }] },
            ]}
          >
            <Text style={styles.title}>{current.name}</Text>
            <Text style={styles.text}>Cuisine: {current.cuisine}</Text>
            <Text style={styles.text}>Price: ₹{current.price}</Text>
            <Text style={styles.text}>Tags: {current.tags.join(", ")}</Text>
            <Text style={styles.hint}>
              → Like | ← Reject | ↑ Wishlist | ↓ Skip
            </Text>
          </Animated.View>
        ) : (
          <Text style={styles.empty}>Deck Finished</Text>
        )}

        <View style={styles.mapBox}>
          <WebView source={{ html: MAP_HTML }} />
        </View>

        <Text style={styles.section}>❤️ Liked</Text>
        {liked.map(renderItem)}

        <Text style={styles.section}>📌 Wishlist</Text>
        {wishlist.map(renderItem)}

        <Text style={styles.section}>❌ Rejected</Text>
        {rejected.map(renderItem)}

        <Text style={styles.section}>⏭️ Skipped</Text>
        {skipped.map(renderItem)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingTop: 50 },
  header: { color: "#fff", fontSize: 22, fontWeight: "700" },
  sub: { color: "#aaa", marginBottom: 10 },
  card: {
    width: width * 0.9,
    backgroundColor: "#1c1c1c",
    borderRadius: 16,
    padding: 18,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "600" },
  text: { color: "#bbb", marginTop: 4 },
  hint: { marginTop: 8, color: "#777", fontSize: 12 },
  mapBox: {
    width: width * 0.9,
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 15,
  },
  section: { color: "#fff", marginTop: 22, fontSize: 16, fontWeight: "600" },
  list: { color: "#aaa", marginTop: 4, textAlign: "center" },
  empty: { color: "#777", marginTop: 40 },
});
