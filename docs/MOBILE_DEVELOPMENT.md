# 📱 RepoRadar Mobile Development Guide

This guide will help you transform RepoRadar into native mobile apps for iOS and Android.

## ✅ Legal Clearance

**Status: FULLY LEGAL ✅**

According to GitHub's Terms of Service and API policies:
- ✅ Third-party apps are explicitly permitted
- ✅ Mobile apps using the API are allowed
- ✅ Both free and commercial apps are acceptable
- ✅ No special approval needed

**Requirements:**
- Must comply with GitHub's Terms of Service
- Must respect rate limits
- Cannot scrape or abuse the API
- Must not misrepresent affiliation with GitHub

## 🎯 Development Approaches

### Option 1: React Native (Recommended for Cross-Platform)

**Pros:**
- Single codebase for iOS + Android
- Large community and ecosystem
- Hot reloading for fast development
- Can reuse web logic

**Setup:**
```bash
# Install React Native CLI
npm install -g react-native-cli

# Create new project
npx react-native init RepoRadar

# Install dependencies
cd RepoRadar
npm install @apollo/client graphql
npm install react-native-vector-icons
npm install @react-navigation/native
npm install react-native-async-storage
```

**Example Component:**
```javascript
// SearchScreen.js
import React, { useState } from 'react';
import { View, TextInput, FlatList, StyleSheet } from 'react-native';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: 'https://api.github.com/graphql',
  cache: new InMemoryCache(),
  headers: {
    Authorization: `Bearer ${GITHUB_TOKEN}`
  }
});

const SEARCH_REPOS = gql`
  query SearchRepos($query: String!) {
    search(query: $query, type: REPOSITORY, first: 30) {
      repositoryCount
      nodes {
        ... on Repository {
          name
          nameWithOwner
          description
          stargazerCount
          url
        }
      }
    }
  }
`;

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const searchRepos = async () => {
    const { data } = await client.query({
      query: SEARCH_REPOS,
      variables: { query }
    });
    setResults(data.search.nodes);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search repositories..."
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={searchRepos}
      />
      <FlatList
        data={results}
        keyExtractor={(item) => item.nameWithOwner}
        renderItem={({ item }) => (
          <RepoCard repo={item} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16
  },
  searchInput: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16
  }
});
```

### Option 2: Flutter

**Pros:**
- Beautiful native performance
- Rich widget library
- Google backing
- Growing ecosystem

**Setup:**
```bash
# Install Flutter SDK from flutter.dev
flutter create reporadar
cd reporadar

# Add dependencies to pubspec.yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  graphql_flutter: ^5.1.0
  cached_network_image: ^3.3.0
```

**Example Code:**
```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';

void main() async {
  await initHiveForFlutter();
  runApp(RepoRadarApp());
}

class RepoRadarApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final HttpLink httpLink = HttpLink('https://api.github.com/graphql');
    
    final AuthLink authLink = AuthLink(
      getToken: () async => 'Bearer $GITHUB_TOKEN',
    );
    
    final Link link = authLink.concat(httpLink);
    
    final ValueNotifier<GraphQLClient> client = ValueNotifier(
      GraphQLClient(
        link: link,
        cache: GraphQLCache(store: HiveStore()),
      ),
    );
    
    return GraphQLProvider(
      client: client,
      child: MaterialApp(
        title: 'RepoRadar',
        theme: ThemeData(primarySwatch: Colors.purple),
        home: SearchScreen(),
      ),
    );
  }
}

class SearchScreen extends StatefulWidget {
  @override
  _SearchScreenState createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  String searchQuery = '';
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('RepoRadar')),
      body: Column(
        children: [
          Padding(
            padding: EdgeInsets.all(16),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search repositories...',
                border: OutlineInputBorder(),
                suffixIcon: Icon(Icons.search),
              ),
              onSubmitted: (value) {
                setState(() => searchQuery = value);
              },
            ),
          ),
          Expanded(
            child: Query(
              options: QueryOptions(
                document: gql(SEARCH_QUERY),
                variables: {'query': searchQuery},
              ),
              builder: (QueryResult result, {refetch, fetchMore}) {
                if (result.isLoading) {
                  return Center(child: CircularProgressIndicator());
                }
                
                if (result.hasException) {
                  return Center(child: Text('Error: ${result.exception}'));
                }
                
                final repos = result.data['search']['nodes'];
                
                return ListView.builder(
                  itemCount: repos.length,
                  itemBuilder: (context, index) {
                    return RepoCard(repo: repos[index]);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

const String SEARCH_QUERY = '''
  query SearchRepos(\$query: String!) {
    search(query: \$query, type: REPOSITORY, first: 30) {
      nodes {
        ... on Repository {
          name
          nameWithOwner
          description
          stargazerCount
          url
        }
      }
    }
  }
''';
```

### Option 3: Native iOS (Swift)

**Pros:**
- Best iOS performance
- Full platform features
- Apple ecosystem integration

**Setup in Xcode:**
```swift
// ContentView.swift
import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = SearchViewModel()
    
    var body: some View {
        NavigationView {
            VStack {
                SearchBar(text: $viewModel.searchQuery)
                    .padding()
                
                List(viewModel.repositories) { repo in
                    RepoRow(repo: repo)
                }
            }
            .navigationTitle("RepoRadar")
        }
    }
}

class SearchViewModel: ObservableObject {
    @Published var searchQuery = ""
    @Published var repositories: [Repository] = []
    
    private let token = "YOUR_GITHUB_TOKEN"
    
    func search() {
        guard !searchQuery.isEmpty else { return }
        
        let query = """
        query {
            search(query: "\(searchQuery)", type: REPOSITORY, first: 30) {
                nodes {
                    ... on Repository {
                        name
                        nameWithOwner
                        description
                        stargazerCount
                    }
                }
            }
        }
        """
        
        var request = URLRequest(url: URL(string: "https://api.github.com/graphql")!)
        request.httpMethod = "POST"
        request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = try? JSONSerialization.data(withJSONObject: ["query": query])
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            // Handle response
        }.resume()
    }
}
```

### Option 4: Native Android (Kotlin)

**Pros:**
- Best Android performance
- Material Design integration
- Android ecosystem features

**Setup:**
```kotlin
// MainActivity.kt
class MainActivity : AppCompatActivity() {
    private lateinit var viewModel: SearchViewModel
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        viewModel = ViewModelProvider(this)[SearchViewModel::class.java]
        
        setupSearch()
        observeResults()
    }
    
    private fun setupSearch() {
        searchButton.setOnClickListener {
            val query = searchEditText.text.toString()
            viewModel.searchRepositories(query)
        }
    }
    
    private fun observeResults() {
        viewModel.repositories.observe(this) { repos ->
            adapter.submitList(repos)
        }
    }
}

// SearchViewModel.kt
class SearchViewModel : ViewModel() {
    private val _repositories = MutableLiveData<List<Repository>>()
    val repositories: LiveData<List<Repository>> = _repositories
    
    private val client = OkHttpClient.Builder()
        .addInterceptor { chain ->
            val request = chain.request().newBuilder()
                .addHeader("Authorization", "Bearer $GITHUB_TOKEN")
                .build()
            chain.proceed(request)
        }
        .build()
    
    fun searchRepositories(query: String) {
        viewModelScope.launch {
            // GraphQL query implementation
        }
    }
}
```

## 🔐 Authentication Strategies

### Option 1: OAuth Flow (Recommended)

**Why?** Users authenticate with their own GitHub accounts
- No need to share your token
- Better rate limits per user
- More secure

**Implementation:**
```javascript
// OAuth Flow
const GITHUB_CLIENT_ID = 'your_client_id';
const REDIRECT_URI = 'reporadar://callback';

// Step 1: Redirect to GitHub
const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=public_repo`;

// Step 2: Handle callback
// Get the code from callback
// Exchange code for access token

// Step 3: Store token securely
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.setItem('github_token', accessToken);
```

### Option 2: GitHub App

**Why?** Best for production apps
- Higher rate limits (15,000/hour)
- Installation-based authentication
- Better for organizations

**Setup:**
1. Create a GitHub App at github.com/settings/apps/new
2. Configure permissions (read-only for public repos)
3. Generate a private key
4. Implement JWT authentication

## 📊 Rate Limit Management

### Smart Caching Strategy

```javascript
// React Native example
import AsyncStorage from '@react-native-async-storage/async-storage';

class CacheManager {
  static async cacheResults(query, results) {
    const cacheKey = `search_${query}`;
    const cacheData = {
      results,
      timestamp: Date.now(),
      expiresIn: 3600000 // 1 hour
    };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
  }
  
  static async getCachedResults(query) {
    const cacheKey = `search_${query}`;
    const cached = await AsyncStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const { results, timestamp, expiresIn } = JSON.parse(cached);
    
    if (Date.now() - timestamp > expiresIn) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }
    
    return results;
  }
}

// Usage
async function searchWithCache(query) {
  // Check cache first
  const cached = await CacheManager.getCachedResults(query);
  if (cached) return cached;
  
  // Fetch from API
  const results = await searchGitHub(query);
  
  // Cache results
  await CacheManager.cacheResults(query, results);
  
  return results;
}
```

### Rate Limit Monitor

```javascript
class RateLimitMonitor {
  static async checkRateLimit(token) {
    const response = await fetch('https://api.github.com/rate_limit', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    const { remaining, reset } = data.resources.graphql;
    
    if (remaining < 10) {
      const resetTime = new Date(reset * 1000);
      console.warn(`Low rate limit! Resets at ${resetTime}`);
      return false;
    }
    
    return true;
  }
}
```

## 🎨 UI/UX Best Practices

### 1. Native Navigation
```javascript
// React Native Navigation
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### 2. Pull to Refresh
```javascript
<FlatList
  data={results}
  refreshing={isRefreshing}
  onRefresh={handleRefresh}
  renderItem={({ item }) => <RepoCard repo={item} />}
/>
```

### 3. Infinite Scroll
```javascript
<FlatList
  data={results}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  ListFooterComponent={<LoadingIndicator />}
/>
```

### 4. Haptic Feedback
```javascript
import * as Haptics from 'expo-haptics';

function onRepoTap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  // Navigate to details
}
```

## 📦 Publishing

### iOS App Store

1. **Requirements:**
   - Apple Developer Account ($99/year)
   - Valid certificates and provisioning profiles
   - App Store guidelines compliance

2. **Submission Steps:**
   ```bash
   # Build for release
   xcodebuild -workspace RepoRadar.xcworkspace \
              -scheme RepoRadar \
              -configuration Release \
              -archivePath RepoRadar.xcarchive \
              archive
   
   # Upload to App Store Connect
   ```

3. **App Store Connect:**
   - Create app listing
   - Add screenshots
   - Write description
   - Submit for review

### Google Play Store

1. **Requirements:**
   - Google Play Developer Account ($25 one-time)
   - Signed APK/AAB
   - Privacy policy URL

2. **Build for Release:**
   ```bash
   # React Native
   cd android
   ./gradlew bundleRelease
   
   # Flutter
   flutter build appbundle
   ```

3. **Play Console:**
   - Create app listing
   - Upload release build
   - Fill out store listing
   - Submit for review

## 💰 Monetization Options

### Free with Ads
```javascript
// Google AdMob integration
import { AdMobBanner } from 'expo-ads-admob';

<AdMobBanner
  bannerSize="fullBanner"
  adUnitID="ca-app-pub-xxxxx"
  onDidFailToReceiveAdWithError={(error) => console.log(error)}
/>
```

### Freemium Model
- Basic search: Free
- Advanced features: $2.99/month
  - Unlimited bookmarks
  - Export results
  - No ads
  - Priority support

### One-time Purchase
- Full app: $4.99
- Pro features unlocked forever

## 🔧 Development Tools

### Useful Libraries

```json
{
  "dependencies": {
    "@apollo/client": "^3.8.0",
    "react-native-vector-icons": "^10.0.0",
    "react-native-async-storage": "^1.19.0",
    "react-native-share": "^10.0.0",
    "react-native-webview": "^13.6.0",
    "react-native-fast-image": "^8.6.0"
  }
}
```

### Testing Tools
- **Jest**: Unit testing
- **Detox**: E2E testing for React Native
- **XCTest**: iOS testing
- **Espresso**: Android testing

## 🚀 Deployment Checklist

- [ ] Set up CI/CD (GitHub Actions, Bitrise, etc.)
- [ ] Implement crash reporting (Sentry, Crashlytics)
- [ ] Add analytics (Google Analytics, Mixpanel)
- [ ] Create privacy policy
- [ ] Test on multiple devices
- [ ] Optimize images and assets
- [ ] Implement deep linking
- [ ] Add app icon and splash screen
- [ ] Test rate limiting
- [ ] Create demo video
- [ ] Write app store description
- [ ] Take screenshots for both platforms

## 📚 Resources

### Documentation
- [GitHub GraphQL API](https://docs.github.com/en/graphql)
- [React Native Docs](https://reactnative.dev/)
- [Flutter Docs](https://flutter.dev/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/)
- [Material Design](https://material.io/)

### Community
- [React Native Community](https://github.com/react-native-community)
- [Flutter Community](https://flutter.dev/community)
- [r/reactnative](https://reddit.com/r/reactnative)
- [r/FlutterDev](https://reddit.com/r/FlutterDev)

## 🎯 Success Metrics

Track these KPIs:
- Daily Active Users (DAU)
- Search success rate
- Average session duration
- Retention rate (Day 1, Day 7, Day 30)
- Crash-free rate
- API rate limit hits
- User ratings and reviews

## 🔒 Security Best Practices

1. **Never hardcode tokens** - Use secure storage
2. **Use HTTPS** - Always encrypt API calls
3. **Validate input** - Prevent injection attacks
4. **Implement timeouts** - Prevent hanging requests
5. **Rate limit locally** - Protect API quotas
6. **Handle errors gracefully** - Don't expose sensitive info
7. **Use certificate pinning** - For production apps

---

## 🎉 You're Ready!

You now have everything you need to build RepoRadar as a mobile app. Choose your preferred framework, follow the setup guide, and start coding!

**Need help?** Check the main README or reach out to the community.

**Good luck, and happy coding! 🚀**