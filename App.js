import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const Stack = createNativeStackNavigator();

// Splash Screen Component
const SplashScreen = ({ navigation }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Rotate animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Fade and scale animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to main screen after 3 seconds
    const timer = setTimeout(() => {
      navigation.replace('Cricket');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.title}>SportsPro</Text>
        <Text style={styles.subtitle}>Live Scores & Updates</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.loadingCircle,
          {
            transform: [{ rotate: spin }],
          },
        ]}
      >
        <View style={styles.cricketBall}>
          <Ionicons name="baseball-outline" size={24} color="white" />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

// Match Details Component
const MatchDetails = ({ route, navigation }) => {
  const { matchId } = route.params;
  const [matchDetails, setMatchDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        const response = await fetch(
          `https://api.cricapi.com/v1/match_info?apikey=cfe7aa6d-bf9f-45c9-b16d-40819cdcc091&id=${matchId}`
        );
        const data = await response.json();
        setMatchDetails(data.data);
      } catch (error) {
        console.error("Error fetching match details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchDetails();
  }, [matchId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FF7F50" />
      </SafeAreaView>
    );
  }

  if (!matchDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Failed to load match details.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{matchDetails.name}</Text>
        <Text style={styles.detailText}>Status: {matchDetails.status}</Text>
        <Text style={styles.detailText}>Venue: {matchDetails.venue}</Text>
        <Text style={styles.detailText}>
          Date: {matchDetails.date} (GMT: {matchDetails.dateTimeGMT})
        </Text>
        <Text style={styles.detailText}>
          Toss: {matchDetails.tossWinner} chose to {matchDetails.tossChoice}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teams</Text>
          {matchDetails?.teamInfo && matchDetails.teamInfo.length > 0 ? (
            matchDetails.teamInfo.map((team, index) => (
              <View key={index} style={styles.teamInfo}>
                <Image source={{ uri: team.img }} style={styles.teamImage} />
                <Text style={styles.teamName}>{team.name}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.detailText}>No team information available.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scores</Text>
          {matchDetails?.score && matchDetails.score.length > 0 ? (
            matchDetails.score.map((inning, index) => (
              <Text key={index} style={styles.detailText}>
                {inning.inning}: {inning.r}/{inning.w} in {inning.o} overs
              </Text>
            ))
          ) : (
            <Text style={styles.detailText}>No score information available.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Cricket Screen Component
const CricketScreen = ({ navigation }) => {
  const [matches, setMatches] = useState([]);
  const [currentMatches, setCurrentMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "upcoming", title: "Upcoming Fixtures" },
    { key: "completed", title: "Completed Matches" },
  ]);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const API_KEY = 'cfe7aa6d-bf9f-45c9-b16d-40819cdcc091';
        
        const matchesResponse = await fetch(
          `https://api.cricapi.com/v1/matches?apikey=${API_KEY}&offset=0`
        );
        const matchesData = await matchesResponse.json();
        
        const currentMatchesResponse = await fetch(
          `https://api.cricapi.com/v1/currentMatches?apikey=${API_KEY}&offset=0`
        );
        const currentMatchesData = await currentMatchesResponse.json();

        setMatches(matchesData.data || []);
        setCurrentMatches(currentMatchesData.data || []);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const renderMatch = ({ item }) => (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() =>
        navigation.navigate("MatchDetails", { matchId: item.id })
      }
    >
      <Text style={styles.matchTitle}>{item.name}</Text>
      <Text style={styles.matchInfo}>Date: {item.date}</Text>
      <Text style={styles.matchInfo}>Venue: {item.venue}</Text>
      <Text style={styles.matchInfo}>
        Status: {item.status || "No status available"}
      </Text>
    </TouchableOpacity>
  );

  const UpcomingFixtures = () => {
    const upcomingMatches = matches.filter((match) => !match.matchStarted);
    return (
      <FlatList
        data={upcomingMatches}
        keyExtractor={(item) => item.id}
        renderItem={renderMatch}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No upcoming matches found.</Text>
        }
      />
    );
  };

  const CompletedMatches = () => {
    const completedMatches = [
      ...matches.filter((match) => match.matchEnded),
      ...currentMatches.filter((match) => match.matchStarted),
    ];

    return (
      <FlatList
        data={completedMatches}
        keyExtractor={(item) => item.id}
        renderItem={renderMatch}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No completed matches found.</Text>
        }
      />
    );
  };

  const renderScene = SceneMap({
    upcoming: UpcomingFixtures,
    completed: CompletedMatches,
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#2A2A72" />
        <ActivityIndicator size="large" color="#FF7F50" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            indicatorStyle={styles.tabIndicator}
            style={styles.tabBar}
            labelStyle={styles.tabLabel}
          />
        )}
      />
    </SafeAreaView>
  );
};

// Main App Component
const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen} 
        />
        <Stack.Screen 
          name="Cricket" 
          component={CricketScreen}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: 'black',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen 
          name="MatchDetails" 
          component={MatchDetails}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: 'black',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  tabBar: {
    backgroundColor: "red",
  },
  tabIndicator: {
    backgroundColor: "white",
  },
  tabLabel: {
    color: "wheat",
    fontWeight: "bold",
  },
  matchCard: {
    backgroundColor: "#333",
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  matchTitle: {
    fontSize: 20,
    color: "red",
    fontWeight: "bold",
  },
  matchInfo: {
    fontSize: 14,
    color: "#FFF",
    marginTop: 5,
  },
  emptyText: {
    textAlign: "center",
    color: "#FFF",
    marginTop: 20,
    fontSize: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#2A2A2A",
  },
  backButtonText: {
    color: "#FFF",
    fontSize: 16,
    marginLeft: 5,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    color: "red",
    textShadowColor: 'rgba(255, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: "wheat",
    marginTop: 8,
  },
  detailText: {
    fontSize: 16,
    color: "#FFF",
    marginVertical: 5,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: "red",
    fontWeight: "bold",
    marginBottom: 10,
  },
  teamInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  teamImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 10,
  },
  teamName: {
    fontSize: 16,
    color: "#FFF",
  },
  errorText: {
    fontSize: 18,
    color: "#FF7F50",
    textAlign: "center",
    marginTop: 20,
  },
  loadingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'red',
    borderTopColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cricketBall: {
    position: 'absolute',
    backgroundColor: 'red',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;