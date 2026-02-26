package content.version;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import content.Content;

public class Version {

	private Optional<Version> parent;
	private Collection<Version> children;
	private Content<?> content;

	private Version(Content<?> content) {
		this.content = content;
		this.children = List.of();
		this.parent = Optional.empty();
	}

	public Version parent() {
		return this.parent.orElseGet(() -> this) ; 
	}
	public Content<?> content(){
		return this.content;
	}
	public Collection<Version> children() {
		return this.children;
	}
	
	
	private void setParent(Version v) {
		this.parent = Optional.of(v);
	}
	private void addChild(Version v) {
		this.children = Stream.concat(this.children.stream(), Stream.of(v))
				.collect(Collectors.toList());
	}
	
	
	public Version getChildVersion() {
		Version childVersion = getNewVersion(this.content());
		this.addChild(childVersion);
		childVersion.setParent(this);
		return childVersion;
		
	}
	

	public static Version getNewVersion(Content<?> content) {
		return new Version(content);
	}
	

}
	

